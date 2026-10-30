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

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
@TestPropertySource(properties = {
    "GOOGLE_CLIENT_ID=test-google-client-id",
    "GEMINI_API_KEY=test-gemini-key"
})
class UserOwnedTablesSchemaTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("Every table with a user column is covered by account deletion")
    void everyUserKeyedTableIsListed() {
        List<String> userKeyedTables = jdbcTemplate.queryForList(
                "SELECT DISTINCT table_name FROM information_schema.columns "
                        + "WHERE table_schema = 'public' AND column_name IN ('user_email', 'email') "
                        + "AND table_name NOT IN ('users', 'flyway_schema_history')",
                String.class);

        Set<String> covered = new HashSet<>(UserOwnedTables.WORKOUT_TABLES);
        UserOwnedTables.DIRECT.forEach(table -> covered.add(table.name()));

        assertThat(userKeyedTables)
                .as("A migration added a user-owned table; list it in UserOwnedTables so account deletion removes it")
                .isNotEmpty()
                .allMatch(covered::contains);
    }

    @Test
    @DisplayName("Every listed table exists with the declared user column")
    void listedTablesMatchSchema() {
        for (UserOwnedTables.Table table : UserOwnedTables.DIRECT) {
            Integer columns = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.columns "
                            + "WHERE table_schema = 'public' AND table_name = ? AND column_name = ?",
                    Integer.class, table.name(), table.userColumn());
            assertThat(columns).as("%s.%s", table.name(), table.userColumn()).isEqualTo(1);
        }
    }
}
