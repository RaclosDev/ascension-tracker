package com.ascension.service;

import com.ascension.util.Emails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;

@Service
public class UserService {
    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    // Every foreign key to users(email) cascades updates, so changeEmail moves all user data in one UPDATE.

    public record User(
            String email,
            String name,
            String picture,
            String googleSub,
            Instant tokensValidAfter
    ) {}

    public record UserSecurityState(
            boolean exists,
            Instant tokensValidAfter
    ) {}

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<User> userRowMapper = (rs, rowNum) -> {
        Timestamp ts = rs.getTimestamp("tokens_valid_after");
        return new User(
                rs.getString("email"),
                rs.getString("name"),
                rs.getString("picture"),
                rs.getString("google_sub"),
                ts != null ? ts.toInstant() : null
        );
    };

    public UserService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<User> findByEmail(String email) {
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }
        String sql = "SELECT email, name, picture, google_sub, tokens_valid_after FROM users WHERE LOWER(email) = LOWER(?)";
        try {
            User user = jdbcTemplate.queryForObject(sql, userRowMapper, email.trim());
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<User> findByGoogleSub(String googleSub) {
        if (googleSub == null || googleSub.isBlank()) {
            return Optional.empty();
        }
        String sql = "SELECT email, name, picture, google_sub, tokens_valid_after FROM users WHERE google_sub = ?";
        try {
            User user = jdbcTemplate.queryForObject(sql, userRowMapper, googleSub.trim());
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Transactional
    public void ensureUserExists(String email, String name, String picture, String googleSub) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("User email cannot be null or blank");
        }
        String cleanEmail = Emails.normalize(email);
        if (googleSub == null) {
            String sql = "INSERT INTO users (email, name, picture, tokens_valid_after) " +
                         "VALUES (?, ?, ?, NOW() - INTERVAL '1 second') " +
                         "ON CONFLICT (email) DO UPDATE SET " +
                         "name = COALESCE(EXCLUDED.name, users.name), " +
                         "picture = COALESCE(EXCLUDED.picture, users.picture)";
            jdbcTemplate.update(sql, cleanEmail, name, picture);
            return;
        }
        jdbcTemplate.update("""
                INSERT INTO users (email, name, picture, google_sub, tokens_valid_after)
                VALUES (?, ?, ?, ?, NOW() - INTERVAL '1 second')
                ON CONFLICT (email) DO NOTHING
                """, cleanEmail, name, picture, googleSub);
        GoogleLinkState current = jdbcTemplate.query("""
                SELECT google_sub, password_hash FROM users WHERE email = ? FOR UPDATE
                """, (rs, row) -> new GoogleLinkState(
                        rs.getString("google_sub"), rs.getString("password_hash")), cleanEmail).getFirst();
        if (current.googleSub() != null && !current.googleSub().equals(googleSub)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Security identity mismatch");
        }
        boolean converting = current.googleSub() == null || current.passwordHash() != null;
        if (converting) {
            jdbcTemplate.update("""
                    UPDATE users SET google_sub = ?, password_hash = NULL, email_verified = TRUE,
                        name = COALESCE(?, name), picture = COALESCE(?, picture),
                        tokens_valid_after = NOW()
                    WHERE email = ?
                    """, googleSub, name, picture, cleanEmail);
            jdbcTemplate.update("DELETE FROM refresh_tokens WHERE email = ?", cleanEmail);
            jdbcTemplate.update("DELETE FROM passkeys WHERE user_id = (SELECT id FROM users WHERE email = ?)", cleanEmail);
            jdbcTemplate.update("DELETE FROM passkey_challenges WHERE user_id = (SELECT id FROM users WHERE email = ?)", cleanEmail);
        } else {
            jdbcTemplate.update("UPDATE users SET name = COALESCE(?, name), picture = COALESCE(?, picture) WHERE email = ?",
                    name, picture, cleanEmail);
        }
    }

    private record GoogleLinkState(String googleSub, String passwordHash) {}

    @Transactional
    public void ensureUserExists(String email, String name, String picture) {
        ensureUserExists(email, name, picture, null);
    }

    @Transactional
    public void ensureUserExists(String email) {
        ensureUserExists(email, null, null, null);
    }

    public UserSecurityState getUserSecurityState(String email) {
        if (email == null || email.isBlank()) {
            return new UserSecurityState(false, null);
        }
        String normalizedEmail = Emails.normalize(email);
        return loadSecurityState(normalizedEmail);
    }

    private UserSecurityState loadSecurityState(String key) {
        try {
            String sql = "SELECT tokens_valid_after FROM users WHERE LOWER(email) = ?";
            Timestamp ts = jdbcTemplate.queryForObject(sql, Timestamp.class, key);
            return new UserSecurityState(true, ts != null ? ts.toInstant() : null);
        } catch (EmptyResultDataAccessException e) {
            return new UserSecurityState(false, null);
        }
    }

    @Transactional
    public void updateTokensValidAfter(String email, Instant timestamp) {
        if (email == null || email.isBlank()) {
            return;
        }
        String normalizedEmail = Emails.normalize(email);
        Instant effectiveTime = timestamp != null ? timestamp : Instant.now();
        Timestamp ts = Timestamp.from(effectiveTime);

        int updated = jdbcTemplate.update("UPDATE users SET tokens_valid_after = ? WHERE LOWER(email) = ?", ts, normalizedEmail);
        if (updated > 0) {
            log.info("Updated tokens_valid_after for user {} to {}", com.ascension.util.PiiMasker.maskEmail(normalizedEmail), effectiveTime);
        }
    }

    /**
     * Moves an account to a new email after the user renames their Google account; the update
     * cascades to every user-owned table and revokes earlier sessions, so other devices sign in again.
     *
     * @return true when an account with this subject and old email was moved
     */
    @Transactional
    public boolean changeEmail(String googleSub, String oldEmail, String newEmail) {
        if (googleSub == null || googleSub.isBlank() || oldEmail == null || newEmail == null || newEmail.isBlank()) {
            throw new IllegalArgumentException("Google subject and both emails are required");
        }
        String cleanOld = Emails.normalize(oldEmail);
        String cleanNew = Emails.normalize(newEmail);
        if (cleanOld.equals(cleanNew)) {
            return false;
        }

        int moved = jdbcTemplate.update(
                "UPDATE users SET email = ?, tokens_valid_after = NOW() - INTERVAL '1 second' "
                        + "WHERE google_sub = ? AND LOWER(email) = ?",
                cleanNew, googleSub.trim(), cleanOld);
        if (moved == 0) {
            return false;
        }
        jdbcTemplate.update("DELETE FROM refresh_tokens WHERE email = ?", cleanNew);

        log.warn("Account email changed from {} to {}; old sessions revoked",
                com.ascension.util.PiiMasker.maskEmail(cleanOld), com.ascension.util.PiiMasker.maskEmail(cleanNew));
        return true;
    }

}
