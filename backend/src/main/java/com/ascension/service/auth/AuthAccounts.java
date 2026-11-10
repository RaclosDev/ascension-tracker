package com.ascension.service.auth;

import com.ascension.util.Emails;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/** Reads the account fields sign-in needs (id and password hash) that UserService does not expose. */
@Component
public class AuthAccounts {

    /** An account as sign-in sees it; passwordHash is null for Google-only accounts. */
    public record Account(UUID id, String email, String name, String picture, String passwordHash) {

        @Override
        public String toString() {
            return "Account[id=" + id + "]";
        }
    }

    private static final String COLUMNS = "SELECT id, email, name, picture, password_hash FROM users ";
    private static final RowMapper<Account> MAPPER = (rs, row) -> new Account(
            rs.getObject("id", UUID.class),
            rs.getString("email"),
            rs.getString("name"),
            rs.getString("picture"),
            rs.getString("password_hash"));

    private final JdbcTemplate jdbc;

    public AuthAccounts(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Account> findByEmail(String email) {
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }
        return jdbc.query(COLUMNS + "WHERE LOWER(email) = ?", MAPPER, Emails.normalize(email)).stream().findFirst();
    }

    public Optional<Account> findById(UUID id) {
        return jdbc.query(COLUMNS + "WHERE id = ?", MAPPER, id).stream().findFirst();
    }
}
