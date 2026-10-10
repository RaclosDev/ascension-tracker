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
        String sql = "INSERT INTO users (email, name, picture) VALUES (?, ?, ?) " +
                     "ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, picture = EXCLUDED.picture";
        jdbcTemplate.update(sql, email, name, picture);
    }
}
