package com.ascension.service.auth;

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
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Proof that the person signing in owns the email address. Accounts created with a password start
 * unverified and get a one-use link by email; until it is used they cannot link a coach, receive push
 * notifications or be an administrator, because anyone can type another person's address into a form.
 */
@Service
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);

    static final Duration TOKEN_TTL = Duration.ofHours(24);
    static final String INVALID_LINK = "El enlace no es válido o ha caducado. Pide otro desde la app.";
    public static final String VERIFY_FIRST = "Verifica tu email para usar esta función. Te lo hemos enviado al registrarte.";

    /** What the app shows about the email of the signed-in account. */
    public record Status(boolean verified, String notice) {
    }

    private final JdbcTemplate jdbc;
    private final EmailSender emailSender;
    private final EmailKeyedLimiter resends = new EmailKeyedLimiter(1, Duration.ofMinutes(1), Clock.systemUTC());
    private final String publicBaseUrl;

    public EmailVerificationService(JdbcTemplate jdbc, EmailSender emailSender,
                                    @Value("${app.public-base-url:https://ascension.raclos.es}") String publicBaseUrl) {
        this.jdbc = jdbc;
        this.emailSender = emailSender;
        this.publicBaseUrl = PasswordAuthService.stripTrailingSlash(publicBaseUrl);
    }

    /** Emails a fresh link. Without an email provider nothing is sent and the account stays unverified. */
    @Transactional
    public void sendLink(UUID userId, String email) {
        if (!emailSender.enabled()) {
            return;
        }
        String token = AuthHashes.randomToken(32);
        Instant now = Instant.now();
        jdbc.update("DELETE FROM email_verification_tokens WHERE user_id = ? OR expires_at < ?", userId, Timestamp.from(now));
        jdbc.update("INSERT INTO email_verification_tokens (user_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?)",
                userId, AuthHashes.sha256(token), Timestamp.from(now), Timestamp.from(now.plus(TOKEN_TTL)));
        emailSender.send(AccountEmails.verifyLink(email, publicBaseUrl + "/verificar-email#token=" + token));
        log.info("Verification link sent to {}", PiiMasker.maskEmail(email));
    }

    /** Sends the link again to an unverified account, at most once a minute. */
    @Transactional
    public void resend(String email) {
        List<UUID> unverified = jdbc.queryForList(
                "SELECT id FROM users WHERE email = ? AND NOT email_verified", UUID.class, Emails.normalize(email));
        if (unverified.isEmpty()) {
            return;
        }
        if (!emailSender.enabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "La verificación por email no está disponible ahora mismo.");
        }
        if (!resends.tryRecord(Emails.normalize(email))) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Espera un minuto antes de pedir otro correo.");
        }
        sendLink(unverified.getFirst(), Emails.normalize(email));
    }

    /** Marks the account of the link as verified; the link works once. */
    @Transactional
    public void verify(String token) {
        if (token == null || token.isBlank() || token.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, INVALID_LINK);
        }
        List<UUID> owners = jdbc.queryForList(
                "SELECT user_id FROM email_verification_tokens WHERE token_hash = ? AND expires_at > ? FOR UPDATE",
                UUID.class, AuthHashes.sha256(token), Timestamp.from(Instant.now()));
        if (owners.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, INVALID_LINK);
        }
        jdbc.update("UPDATE users SET email_verified = TRUE WHERE id = ?", owners.getFirst());
        jdbc.update("DELETE FROM email_verification_tokens WHERE user_id = ?", owners.getFirst());
    }

    public boolean isVerified(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return Boolean.TRUE.equals(jdbc.query("SELECT email_verified FROM users WHERE email = ?",
                rs -> rs.next() ? rs.getBoolean(1) : null, Emails.normalize(email)));
    }

    /** 403 with an explanation unless the account has verified its email. */
    public void requireVerified(String email) {
        if (!isVerified(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, VERIFY_FIRST);
        }
    }

    public Status status(String email) {
        return jdbc.query("SELECT email_verified, account_notice FROM users WHERE email = ?",
                rs -> rs.next() ? new Status(rs.getBoolean(1), rs.getString(2)) : new Status(false, null),
                Emails.normalize(email));
    }

    @Transactional
    public void dismissNotice(String email) {
        jdbc.update("UPDATE users SET account_notice = NULL WHERE email = ?", Emails.normalize(email));
    }
}
