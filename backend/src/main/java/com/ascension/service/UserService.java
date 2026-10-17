package com.ascension.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
public class UserService {
    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    // TODO: Future architectural enhancement: Migrate user-referencing tables from email PK to a surrogate UUID
    // to decouple internal database foreign keys from mutable email addresses and OAuth subject identifiers.

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

    // 30-second TTL Caffeine cache to protect DB against high-frequency token checks
    private final Cache<String, UserSecurityState> securityCache = Caffeine.newBuilder()
            .expireAfterWrite(30, TimeUnit.SECONDS)
            .maximumSize(10_000)
            .build();

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
        String cleanEmail = email.trim().toLowerCase(Locale.ROOT);
        String sql = "INSERT INTO users (email, name, picture, google_sub, tokens_valid_after) " +
                     "VALUES (?, ?, ?, ?, NOW() - INTERVAL '1 second') " +
                     "ON CONFLICT (email) DO UPDATE SET " +
                     "name = COALESCE(EXCLUDED.name, users.name), " +
                     "picture = COALESCE(EXCLUDED.picture, users.picture), " +
                     "google_sub = COALESCE(users.google_sub, EXCLUDED.google_sub)";
        jdbcTemplate.update(sql, cleanEmail, name, picture, googleSub);

        // Refresh cache entry
        findByEmail(cleanEmail).ifPresent(user ->
                securityCache.put(cleanEmail.toLowerCase(Locale.ROOT), new UserSecurityState(true, user.tokensValidAfter()))
        );
    }

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
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        return securityCache.get(normalizedEmail, key -> {
            try {
                String sql = "SELECT tokens_valid_after FROM users WHERE LOWER(email) = ?";
                Timestamp ts = jdbcTemplate.queryForObject(sql, Timestamp.class, key);
                return new UserSecurityState(true, ts != null ? ts.toInstant() : null);
            } catch (EmptyResultDataAccessException e) {
                return new UserSecurityState(false, null);
            }
        });
    }

    @Transactional
    public void updateTokensValidAfter(String email, Instant timestamp) {
        if (email == null || email.isBlank()) {
            return;
        }
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        Instant effectiveTime = timestamp != null ? timestamp : Instant.now();
        Timestamp ts = Timestamp.from(effectiveTime);

        int updated = jdbcTemplate.update("UPDATE users SET tokens_valid_after = ? WHERE LOWER(email) = ?", ts, normalizedEmail);
        if (updated > 0) {
            securityCache.put(normalizedEmail, new UserSecurityState(true, effectiveTime));
            log.info("Updated tokens_valid_after for user {} to {}", com.ascension.util.PiiMasker.maskEmail(normalizedEmail), effectiveTime);
        } else {
            securityCache.invalidate(normalizedEmail);
        }
    }

    public void evictUser(String email) {
        if (email != null && !email.isBlank()) {
            securityCache.invalidate(email.trim().toLowerCase(Locale.ROOT));
        }
    }
}
