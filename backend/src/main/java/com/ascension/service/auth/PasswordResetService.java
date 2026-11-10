package com.ascension.service.auth;

import com.ascension.service.RefreshTokenService;
import com.ascension.service.UserService;
import com.ascension.service.auth.AuthAccounts.Account;
import com.ascension.util.Emails;
import com.ascension.util.PiiMasker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Password reset by a one-use link sent by email. Asking for it answers the same whether the email
 * has an account or not. Using it closes every session and removes the passkeys of the account,
 * in case someone else had got in.
 */
@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    static final Duration TOKEN_TTL = Duration.ofMinutes(30);
    static final String INVALID_LINK = "El enlace no es válido o ha caducado. Pide otro.";

    private final JdbcTemplate jdbc;
    private final AuthAccounts accounts;
    private final EmailSender emailSender;
    private final AccountEmailThrottle throttle;
    private final PasswordAuthService passwords;
    private final UserService userService;
    private final RefreshTokenService refreshTokenService;
    private final String publicBaseUrl;

    public PasswordResetService(JdbcTemplate jdbc, AuthAccounts accounts, EmailSender emailSender,
                                AccountEmailThrottle throttle, PasswordAuthService passwords,
                                UserService userService, RefreshTokenService refreshTokenService,
                                @Value("${app.public-base-url:https://ascension.raclos.es}") String publicBaseUrl) {
        this.jdbc = jdbc;
        this.accounts = accounts;
        this.emailSender = emailSender;
        this.throttle = throttle;
        this.passwords = passwords;
        this.userService = userService;
        this.refreshTokenService = refreshTokenService;
        this.publicBaseUrl = PasswordAuthService.stripTrailingSlash(publicBaseUrl);
    }

    /** Emails a reset link (or, for Google-only accounts, how to sign in). Silent for unknown emails. */
    @Transactional
    public void requestReset(String rawEmail) {
        String email = PasswordAuthService.validEmail(rawEmail);
        passwords.requireEmailProvider();
        Account account = accounts.findByEmail(email).orElse(null);
        if (account == null || !throttle.tryAcquire(email)) {
            return;
        }
        if (account.passwordHash() == null) {
            emailSender.send(AccountEmails.signInWithGoogle(account.email(), publicBaseUrl));
            return;
        }
        String token = AuthHashes.randomToken(32);
        Instant now = Instant.now();
        jdbc.update("DELETE FROM password_reset_tokens WHERE user_id = ? OR expires_at < ?", account.id(), Timestamp.from(now));
        jdbc.update("INSERT INTO password_reset_tokens (user_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?)",
                account.id(), AuthHashes.sha256(token), Timestamp.from(now), Timestamp.from(now.plus(TOKEN_TTL)));
        emailSender.send(AccountEmails.resetLink(account.email(), publicBaseUrl + "/restablecer-contrasena#token=" + token));
        log.info("Password reset link sent to {}", PiiMasker.maskEmail(email));
    }

    /**
     * Sets the new password with a valid link, closes every session and removes the passkeys.
     *
     * @return the account, to open a new session
     */
    @Transactional
    public Account reset(String token, String newPassword) {
        if (token == null || token.isBlank() || token.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, INVALID_LINK);
        }
        List<UUID> owners = jdbc.queryForList(
                "SELECT user_id FROM password_reset_tokens WHERE token_hash = ? AND expires_at > ? FOR UPDATE",
                UUID.class, AuthHashes.sha256(token), Timestamp.from(Instant.now()));
        if (owners.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, INVALID_LINK);
        }
        Account account = accounts.findById(owners.getFirst())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, INVALID_LINK));
        PasswordPolicy.validate(newPassword, account.email());

        int updated = jdbc.update("UPDATE users SET password_hash = ? WHERE id = ? AND google_sub IS NULL",
                passwords.encoder().encode(newPassword), account.id());
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, INVALID_LINK);
        }
        jdbc.update("DELETE FROM password_reset_tokens WHERE user_id = ?", account.id());
        jdbc.update("DELETE FROM passkeys WHERE user_id = ?", account.id());
        jdbc.update("DELETE FROM passkey_challenges WHERE user_id = ?", account.id());
        userService.updateTokensValidAfter(account.email(), Instant.now());
        refreshTokenService.deleteByEmail(Emails.normalize(account.email()));
        String masked = PiiMasker.maskEmail(account.email());
        log.info("Password reset for {}", masked);
        return account;
    }
}
