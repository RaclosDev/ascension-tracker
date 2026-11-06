package com.ascension.service;

import com.ascension.util.Emails;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Resolves the internal user id for an email, so each service doesn't repeat the query. */
@Component
public class UserIdLookup {

    private final JdbcTemplate jdbcTemplate;

    public UserIdLookup(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<UUID> find(String email) {
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }
        List<UUID> ids = jdbcTemplate.queryForList("SELECT id FROM users WHERE email = ?", UUID.class,
                Emails.normalize(email));
        return ids.stream().findFirst();
    }

    public UUID require(String email) {
        return find(email).orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
    }
}
