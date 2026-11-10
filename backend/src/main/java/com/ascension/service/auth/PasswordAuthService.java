package com.ascension.service.auth;

import com.ascension.service.auth.AuthAccounts.Account;
import com.ascension.util.Emails;
import com.ascension.util.PiiMasker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Duration;
import java.util.regex.Pattern;

/**
 * Sign-up and sign-in with email and password. New accounts can sign in immediately;
 * their email is recorded as unverified.
 */
@Service
public class PasswordAuthService {

    private static final Logger log = LoggerFactory.getLogger(PasswordAuthService.class);

    static final int MAX_LOGIN_FAILURES = 10;
    static final Duration LOGIN_WINDOW = Duration.ofMinutes(15);
    private static final int MAX_EMAIL_LENGTH = 254;
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    static final String INVALID_CREDENTIALS = "Email o contraseña incorrectos.";

    private final JdbcTemplate jdbc;
    private final AuthAccounts accounts;
    private final EmailSender emailSender;
    private final BCryptPasswordEncoder encoder;
    private final String dummyHash;
    private final EmailKeyedLimiter loginFailures;
    private final Clock clock;

    public PasswordAuthService(JdbcTemplate jdbc, AuthAccounts accounts, EmailSender emailSender) {
        this.jdbc = jdbc;
        this.accounts = accounts;
        this.emailSender = emailSender;
        this.encoder = new BCryptPasswordEncoder(12);
        // Compared against when the email has no password, so the answer takes as long either way.
        this.dummyHash = encoder.encode(AuthHashes.randomToken(16));
        this.clock = Clock.systemUTC();
        this.loginFailures = new EmailKeyedLimiter(MAX_LOGIN_FAILURES, LOGIN_WINDOW, clock);
    }

    BCryptPasswordEncoder encoder() {
        return encoder;
    }

    @Transactional
    public Account register(String rawEmail, String password) {
        String email = validEmail(rawEmail);
        PasswordPolicy.validate(password, email);
        String passwordHash = encoder.encode(password);
        int created = jdbc.update("""
                INSERT INTO users (email, name, password_hash, email_verified, tokens_valid_after)
                VALUES (?, ?, ?, FALSE, NOW() - INTERVAL '1 second')
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
                    "El restablecimiento de contraseña por email no está disponible ahora mismo.");
        }
    }

    static String validEmail(String rawEmail) {
        String email = Emails.normalize(rawEmail);
        if (email == null || email.length() > MAX_EMAIL_LENGTH || !EMAIL.matcher(email).matches()) {
            throw badRequest("Escribe un email válido.");
        }
        return email;
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
