package com.ascension.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    private final JdbcTemplate jdbcTemplate;

    public UserService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public void ensureUserExists(String email, String name, String picture) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("User email cannot be null or blank");
        }
        String sql = "INSERT INTO users (email, name, picture) VALUES (?, ?, ?) " +
                     "ON CONFLICT (email) DO UPDATE SET " +
                     "name = COALESCE(EXCLUDED.name, users.name), " +
                     "picture = COALESCE(EXCLUDED.picture, users.picture)";
        jdbcTemplate.update(sql, email.trim(), name, picture);
    }

    @Transactional
    public void ensureUserExists(String email) {
        ensureUserExists(email, null, null);
    }
}
