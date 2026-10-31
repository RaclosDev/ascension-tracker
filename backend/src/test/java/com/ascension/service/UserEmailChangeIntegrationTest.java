package com.ascension.service;

import com.ascension.TestcontainersConfiguration;
import com.ascension.support.DisabledIfDockerUnavailable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
@TestPropertySource(properties = {
    "GOOGLE_CLIENT_ID=test-google-client-id",
    "GEMINI_API_KEY=test-gemini-key"
})
class UserEmailChangeIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserService userService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Test
    @DisplayName("Every foreign key to users cascades updates")
    void everyUserForeignKeyCascadesUpdates() {
        List<String> notCascading = jdbcTemplate.queryForList(
                "SELECT conrelid::regclass::text || '.' || conname FROM pg_constraint "
                        + "WHERE contype = 'f' AND confrelid = 'users'::regclass AND confupdtype <> 'c'",
                String.class);

        assertThat(notCascading)
                .as("Foreign keys to users(email) must use ON UPDATE CASCADE so changeEmail can move data")
                .isEmpty();
    }

    @Test
    @DisplayName("changeEmail moves the user's rows and revokes their sessions")
    void changeEmailMovesDataAndRevokesSessions() {
        String oldEmail = "before-rename@example.com";
        String newEmail = "after-rename@example.com";
        userService.ensureUserExists(oldEmail, "Athlete", null, "sub-rename-1");
        jdbcTemplate.update("INSERT INTO weight_entries (date, weight, user_email) VALUES (CURRENT_DATE, 80.5, ?)", oldEmail);
        jdbcTemplate.update("INSERT INTO steps_entries (date, steps, user_email) VALUES (CURRENT_DATE, 9000, ?)", oldEmail);
        refreshTokenService.createRefreshToken(oldEmail);

        boolean moved = userService.changeEmail("sub-rename-1", oldEmail, newEmail);

        assertThat(moved).isTrue();
        assertThat(count("users", "email", oldEmail)).isZero();
        assertThat(count("users", "email", newEmail)).isEqualTo(1);
        assertThat(count("weight_entries", "user_email", newEmail)).isEqualTo(1);
        assertThat(count("steps_entries", "user_email", newEmail)).isEqualTo(1);
        assertThat(count("weight_entries", "user_email", oldEmail)).isZero();
        assertThat(count("refresh_tokens", "email", newEmail)).isZero();
        assertThat(count("refresh_tokens", "email", oldEmail)).isZero();
    }

    @Test
    @DisplayName("changeEmail does nothing when the subject does not own the old email")
    void changeEmailRequiresMatchingSubject() {
        String email = "owner-check@example.com";
        userService.ensureUserExists(email, "Owner", null, "sub-owner-1");

        boolean moved = userService.changeEmail("sub-someone-else", email, "hijack@example.com");

        assertThat(moved).isFalse();
        assertThat(count("users", "email", email)).isEqualTo(1);
        assertThat(count("users", "email", "hijack@example.com")).isZero();
    }

    private int count(String table, String column, String email) {
        Integer rows = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + table + " WHERE " + column + " = ?", Integer.class, email);
        return rows == null ? 0 : rows;
    }
}
