package com.ascension.service.auth;

import com.ascension.service.auth.AuthAccounts.Account;
import com.ascension.util.Emails;
import com.ascension.util.PiiMasker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Sign-up and sign-in with email and password. Signing up only creates the account once the
 * 6-digit code sent by email is entered, so nobody can claim an address that is not theirs. No
 * answer reveals whether an email has an account: sign-up always says "check your email" and a
 * failed sign-in always gives the same message.
 */
@Service
public class PasswordAuthService {

    private static final Logger log = LoggerFactory.getLogger(PasswordAuthService.class);

    static final Duration CODE_TTL = Duration.ofMinutes(15);
    static final int MAX_CODE_ATTEMPTS = 5;
    static final int MAX_LOGIN_FAILURES = 10;
    static final Duration LOGIN_WINDOW = Duration.ofMinutes(15);
    private static final int MAX_EMAIL_LENGTH = 254;
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    static final String INVALID_CREDENTIALS = "Email o contraseña incorrectos.";
    static final String INVALID_CODE = "El código no es correcto o ha caducado. Pide otro.";

    private final JdbcTemplate jdbc;
    private final AuthAccounts accounts;
    private final EmailSender emailSender;
    private final AccountEmailThrottle throttle;
    private final BCryptPasswordEncoder encoder;
    private final String dummyHash;
    private final String publicBaseUrl;
    private final EmailKeyedLimiter loginFailures;
    private final Clock clock;

    public PasswordAuthService(JdbcTemplate jdbc, AuthAccounts accounts, EmailSender emailSender,
                               AccountEmailThrottle throttle,
                               @Value("${app.public-base-url:https://ascension.raclos.es}") String publicBaseUrl) {
        this.jdbc = jdbc;
        this.accounts = accounts;
        this.emailSender = emailSender;
        this.throttle = throttle;
        this.encoder = new BCryptPasswordEncoder(12);
        // Compared against when the email has no password, so the answer takes as long either way.
        this.dummyHash = encoder.encode(AuthHashes.randomToken(16));
        this.publicBaseUrl = stripTrailingSlash(publicBaseUrl);
        this.clock = Clock.systemUTC();
        this.loginFailures = new EmailKeyedLimiter(MAX_LOGIN_FAILURES, LOGIN_WINDOW, clock);
    }

    BCryptPasswordEncoder encoder() {
        return encoder;
    }

    /**
     * Starts a sign-up: emails a 6-digit code, or a notice when the email already has an account.
     * Answers the same in both cases.
     */
    @Transactional
    public void register(String rawEmail, String password) {
        String email = validEmail(rawEmail);
        PasswordPolicy.validate(password, email);
        requireEmailProvider();
        // Hash first, so the answer takes the same time whether the account exists or not.
        String passwordHash = encoder.encode(password);
        if (accounts.findByEmail(email).isPresent()) {
            if (throttle.tryAcquire(email)) {
                emailSender.send(AccountEmails.alreadyRegistered(email, publicBaseUrl));
            }
            log.info("Sign-up attempt for an existing account {}", PiiMasker.maskEmail(email));
            return;
        }
        if (!throttle.tryAcquire(email)) {
            // A code was sent less than a minute ago: keep it valid instead of replacing it.
            return;
        }
        String code = AuthHashes.sixDigitCode();
        Instant now = clock.instant();
        jdbc.update("DELETE FROM pending_registrations WHERE expires_at < ?", Timestamp.from(now));
        jdbc.update("""
                INSERT INTO pending_registrations (email_hash, password_hash, code_hash, attempts, created_at, expires_at)
                VALUES (?, ?, ?, 0, ?, ?)
                ON CONFLICT (email_hash) DO UPDATE SET password_hash = EXCLUDED.password_hash,
                    code_hash = EXCLUDED.code_hash, attempts = 0,
                    created_at = EXCLUDED.created_at, expires_at = EXCLUDED.expires_at
                """,
                emailHash(email), passwordHash, codeHash(email, code), Timestamp.from(now), Timestamp.from(now.plus(CODE_TTL)));
        emailSender.send(AccountEmails.signUpCode(email, code));
    }

    /**
     * Finishes a sign-up with the emailed code and the same password, and creates the account.
     * Wrong codes count even though the request fails; after {@link #MAX_CODE_ATTEMPTS} the code is
     * discarded.
     *
     * @return the new account
     */
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public Account confirmRegistration(String rawEmail, String code, String password) {
        String email = validEmail(rawEmail);
        String key = emailHash(email);
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT password_hash, code_hash, attempts, expires_at FROM pending_registrations WHERE email_hash = ? FOR UPDATE",
                key);
        if (rows.isEmpty()) {
            throw badRequest(INVALID_CODE);
        }
        Map<String, Object> pending = rows.getFirst();
        Instant expiresAt = ((Timestamp) pending.get("expires_at")).toInstant();
        int attempts = ((Number) pending.get("attempts")).intValue();
        if (!clock.instant().isBefore(expiresAt) || attempts >= MAX_CODE_ATTEMPTS) {
            jdbc.update("DELETE FROM pending_registrations WHERE email_hash = ?", key);
            throw badRequest(INVALID_CODE);
        }
        boolean codeMatches = code != null && code.matches("\\d{6}")
                && AuthHashes.sameHash(codeHash(email, code), (String) pending.get("code_hash"));
        String passwordHash = (String) pending.get("password_hash");
        if (!codeMatches || password == null || PasswordPolicy.tooLong(password) || !encoder.matches(password, passwordHash)) {
            jdbc.update("UPDATE pending_registrations SET attempts = attempts + 1 WHERE email_hash = ?", key);
            throw badRequest(INVALID_CODE);
        }
        jdbc.update("DELETE FROM pending_registrations WHERE email_hash = ?", key);
        int created = jdbc.update("""
                INSERT INTO users (email, name, password_hash, tokens_valid_after)
                VALUES (?, ?, ?, NOW() - INTERVAL '1 second')
                ON CONFLICT (email) DO NOTHING
                """, email, email.split("@", 2)[0], passwordHash);
        if (created == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya tienes una cuenta con este email. Inicia sesión.");
        }
        log.info("Account created with a password: {}", PiiMasker.maskEmail(email));
        return accounts.findByEmail(email).orElseThrow();
    }

    /**
     * Checks the password. Same 401 for an unknown email, an account without password and a wrong
     * password; 429 after {@link #MAX_LOGIN_FAILURES} failures for the email in {@link #LOGIN_WINDOW}.
     */
    public Account login(String rawEmail, String password) {
        String email = Emails.normalize(rawEmail);
        if (email == null || email.isEmpty() || email.length() > MAX_EMAIL_LENGTH || password == null) {
            throw unauthorized();
        }
        if (loginFailures.exhausted(email)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Demasiados intentos. Espera unos minutos o restablece la contraseña.");
        }
        Account account = accounts.findByEmail(email).orElse(null);
        String hash = account != null && account.passwordHash() != null ? account.passwordHash() : dummyHash;
        boolean matches = !PasswordPolicy.tooLong(password) && encoder.matches(password, hash);
        if (account == null || account.passwordHash() == null || !matches) {
            loginFailures.record(email);
            log.info("Failed password sign-in for {}", PiiMasker.maskEmail(email));
            throw unauthorized();
        }
        loginFailures.reset(email);
        return account;
    }

    void requireEmailProvider() {
        if (!emailSender.enabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "El acceso con email no está disponible ahora mismo. Entra con Google.");
        }
    }

    static String validEmail(String rawEmail) {
        String email = Emails.normalize(rawEmail);
        if (email == null || email.length() > MAX_EMAIL_LENGTH || !EMAIL.matcher(email).matches()) {
            throw badRequest("Escribe un email válido.");
        }
        return email;
    }

    private static String emailHash(String email) {
        return AuthHashes.sha256(email);
    }

    private static String codeHash(String email, String code) {
        return AuthHashes.sha256(email + ":" + code);
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private static ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, INVALID_CREDENTIALS);
    }

    static String stripTrailingSlash(String url) {
        return url != null && url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
