package com.ascension.service.auth;

import com.ascension.service.auth.AuthAccounts.Account;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Recent proof that whoever holds the session is the owner of the account, asked before sensitive
 * actions such as adding a passkey: a stolen access token alone is not enough. Accounts with a
 * password confirm with it; accounts that only sign in with Google, with a fresh Google credential
 * of the same identity. Failures count per account and lock the check for {@link #WINDOW}.
 */
@Component
public class IdentityConfirmation {

    private static final Logger log = LoggerFactory.getLogger(IdentityConfirmation.class);

    static final int MAX_FAILURES = 10;
    static final Duration WINDOW = Duration.ofMinutes(15);
    static final Duration MAX_CREDENTIAL_AGE = Duration.ofMinutes(10);
    static final String NOT_CONFIRMED = "No hemos podido confirmar tu identidad. Revisa la contraseña o confirma con Google.";
    static final String TOO_MANY = "Demasiados intentos. Espera unos minutos antes de volver a probar.";

    private final PasswordAuthService passwords;
    private final GoogleIdTokenVerifier googleVerifier;
    private final JdbcTemplate jdbc;
    private final EmailKeyedLimiter failures = new EmailKeyedLimiter(MAX_FAILURES, WINDOW, Clock.systemUTC());

    public IdentityConfirmation(PasswordAuthService passwords, GoogleIdTokenVerifier googleVerifier, JdbcTemplate jdbc) {
        this.passwords = passwords;
        this.googleVerifier = googleVerifier;
        this.jdbc = jdbc;
    }

    /**
     * Throws 429 after too many failures and 403 when the proof is missing or wrong. The password and
     * the credential are never logged.
     */
    public void confirm(Account account, String password, String googleCredential) {
        String key = account.id().toString();
        if (failures.exhausted(key)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, TOO_MANY);
        }
        boolean confirmed = account.passwordHash() != null
                ? passwordMatches(account, password)
                : googleMatches(account, googleCredential);
        if (!confirmed) {
            failures.record(key);
            log.info("Identity confirmation failed for account {}", account.id());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, NOT_CONFIRMED);
        }
        failures.reset(key);
    }

    private boolean passwordMatches(Account account, String password) {
        return password != null && !password.isEmpty() && !PasswordPolicy.tooLong(password)
                && passwords.encoder().matches(password, account.passwordHash());
    }

    /** The credential must have been issued a moment ago, so an old one found somewhere is not enough. */
    private boolean issuedRecently(Long issuedAtSeconds) {
        if (issuedAtSeconds == null) {
            return false;
        }
        long age = Instant.now().getEpochSecond() - issuedAtSeconds;
        return age >= -60 && age <= MAX_CREDENTIAL_AGE.toSeconds();
    }

    private boolean googleMatches(Account account, String credential) {
        if (credential == null || credential.isBlank() || credential.length() > 8192) {
            return false;
        }
        List<String> stored = jdbc.queryForList("SELECT google_sub FROM users WHERE id = ?", String.class, account.id());
        String accountSub = stored.isEmpty() ? null : stored.getFirst();
        if (accountSub == null) {
            return false;
        }
        try {
            GoogleIdToken token = googleVerifier.verify(credential);
            if (token == null) {
                return false;
            }
            GoogleIdToken.Payload payload = token.getPayload();
            return Boolean.TRUE.equals(payload.getEmailVerified()) && accountSub.equals(payload.getSubject())
                    && issuedRecently(payload.getIssuedAtTimeSeconds());
        } catch (GeneralSecurityException | IOException | IllegalArgumentException e) {
            log.info("Google credential could not be verified for identity confirmation: {}", e.getClass().getSimpleName());
            return false;
        }
    }
}
