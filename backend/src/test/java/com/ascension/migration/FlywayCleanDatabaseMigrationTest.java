package com.ascension.migration;

import com.ascension.TestcontainersConfiguration;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import com.ascension.support.DisabledIfDockerUnavailable;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
@TestPropertySource(properties = {
    "spring.flyway.baseline-on-migrate=false",
    "spring.flyway.enabled=true",
    "GOOGLE_CLIENT_ID=test-google-client-id",
    "GEMINI_API_KEY=test-gemini-key"
})
class FlywayCleanDatabaseMigrationTest {

    @Autowired
    private Flyway flyway;

    @Test
    @DisplayName("Verify that all Flyway migrations (V1..Vn) apply cleanly on an empty database without baseline-on-migrate")
    void flywayMigrations_applyCleanlyOnEmptyDatabaseWithoutBaseline() {
        MigrationInfo[] appliedMigrations = flyway.info().applied();

        assertThat(appliedMigrations)
                .as("All Flyway migrations should have applied successfully on empty database")
                .isNotEmpty();

        assertThat(appliedMigrations.length)
                .as("All 25 Flyway migrations (V1 to V25) should be applied")
                .isGreaterThanOrEqualTo(25);

        boolean allSuccessful = Arrays.stream(appliedMigrations)
                .allMatch(m -> m.getState().isApplied());

        assertThat(allSuccessful)
                .as("Every migration must be in applied state without failure")
                .isTrue();

        assertThat(flyway.getConfiguration().isBaselineOnMigrate())
                .as("baseline-on-migrate must be false in this test to ensure zero-base verification")
                .isFalse();
    }
}
