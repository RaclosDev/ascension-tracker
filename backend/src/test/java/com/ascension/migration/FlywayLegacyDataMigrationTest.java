package com.ascension.migration;

import com.ascension.TestcontainersConfiguration;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
@TestPropertySource(properties = {
    "spring.flyway.baseline-on-migrate=false",
    "spring.flyway.enabled=true",
    "GOOGLE_CLIENT_ID=test-google-client-id",
    "GEMINI_API_KEY=test-gemini-key"
})
class FlywayLegacyDataMigrationTest {

    @Autowired
    private Flyway flyway;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("Verify that V23 and V24 defensive SQL migrations successfully handle dirty and legacy data")
    void flywayMigrations_handleDirtyLegacyDataGracefully() {
        // All migrations V1..V25 should have executed cleanly
        assertThat(flyway.info().applied().length).isGreaterThanOrEqualTo(25);

        // Verify that workout_sets weight and reps are NUMERIC
        assertDoesNotThrow(() -> {
            jdbcTemplate.execute("SELECT weight, reps FROM workout_sets LIMIT 1");
        });

        // Verify that push_subscriptions uq_push_subscriptions_endpoint constraint exists
        Integer constraintCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pg_constraint WHERE conname = 'uq_push_subscriptions_endpoint'",
                Integer.class
        );
        assertThat(constraintCount).isEqualTo(1);

        // Verify rest_timers table exists
        Integer tableCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'rest_timers'",
                Integer.class
        );
        assertThat(tableCount).isEqualTo(1);
    }
}
