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

import com.ascension.support.DisabledIfDockerUnavailable;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@SpringBootTest
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
@TestPropertySource(properties = {
    "spring.flyway.baseline-on-migrate=false",
    "spring.flyway.clean-disabled=false",
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
        // Clean database and migrate to V22 where weight/reps are VARCHAR and push_subscriptions has duplicates
        flyway.clean();
        Flyway flywayV22 = Flyway.configure()
                .configuration(flyway.getConfiguration())
                .target("22")
                .load();
        flywayV22.migrate();

        // 0. Ensure users exist for foreign key constraint fk_workouts_user_email and fk_push_user_email
        jdbcTemplate.update("INSERT INTO users (email) VALUES ('legacy@test.com') ON CONFLICT (email) DO NOTHING");
        jdbcTemplate.update("INSERT INTO users (email) VALUES ('legacy2@test.com') ON CONFLICT (email) DO NOTHING");

        // 1. Insert legacy hierarchy
        jdbcTemplate.update("INSERT INTO workouts (id, name, user_email, started_at) VALUES ('w_test', 'Legacy Workout', 'legacy@test.com', 1000)");
        jdbcTemplate.update("INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES ('we_test', 'w_test', 'squat', 0)");

        // 2. Insert dirty sets into VARCHAR columns:
        // s1: standard decimal
        jdbcTemplate.update("INSERT INTO workout_sets (id, workout_exercise_id, weight, reps, order_index) VALUES ('s1', 'we_test', '100.5', '10', 0)");
        // s2: comma decimal separator
        jdbcTemplate.update("INSERT INTO workout_sets (id, workout_exercise_id, weight, reps, order_index) VALUES ('s2', 'we_test', '80,25', '8,5', 1)");
        // s3: dirty non-numeric strings
        jdbcTemplate.update("INSERT INTO workout_sets (id, workout_exercise_id, weight, reps, order_index) VALUES ('s3', 'we_test', 'abc', 'reps-to-fail', 2)");
        // s4: overflow (> 8 integer digits)
        jdbcTemplate.update("INSERT INTO workout_sets (id, workout_exercise_id, weight, reps, order_index) VALUES ('s4', 'we_test', '123456789.99', '999999999', 3)");
        // s5: whitespace around numbers
        jdbcTemplate.update("INSERT INTO workout_sets (id, workout_exercise_id, weight, reps, order_index) VALUES ('s5', 'we_test', '  75.50  ', ' 12 ', 4)");

        // 3. Insert duplicate push subscriptions for V24 test
        jdbcTemplate.update("INSERT INTO push_subscriptions (user_email, endpoint, p256dh, auth) VALUES ('legacy@test.com', 'https://push.example.com/dup', 'k1', 'a1')");
        jdbcTemplate.update("INSERT INTO push_subscriptions (user_email, endpoint, p256dh, auth) VALUES ('legacy2@test.com', 'https://push.example.com/dup', 'k2', 'a2')");

        // 4. Run migrations from V22 through latest (V23, V24, V25)
        Flyway flywayLatest = Flyway.configure()
                .configuration(flyway.getConfiguration())
                .target("latest")
                .load();
        assertDoesNotThrow(flywayLatest::migrate);

        // 5. Assertions on V23 numeric conversions:
        BigDecimal s1Weight = jdbcTemplate.queryForObject("SELECT weight FROM workout_sets WHERE id = 's1'", BigDecimal.class);
        assertThat(s1Weight).isEqualByComparingTo("100.50");

        BigDecimal s2Weight = jdbcTemplate.queryForObject("SELECT weight FROM workout_sets WHERE id = 's2'", BigDecimal.class);
        assertThat(s2Weight).isEqualByComparingTo("80.25");

        BigDecimal s3Weight = jdbcTemplate.queryForObject("SELECT weight FROM workout_sets WHERE id = 's3'", BigDecimal.class);
        assertThat(s3Weight).isNull();

        BigDecimal s4Weight = jdbcTemplate.queryForObject("SELECT weight FROM workout_sets WHERE id = 's4'", BigDecimal.class);
        assertThat(s4Weight).isNull();

        BigDecimal s5Weight = jdbcTemplate.queryForObject("SELECT weight FROM workout_sets WHERE id = 's5'", BigDecimal.class);
        assertThat(s5Weight).isEqualByComparingTo("75.50");

        // 6. Assertions on V24 deduplication and table creation:
        Integer pushCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM push_subscriptions WHERE endpoint = 'https://push.example.com/dup'",
                Integer.class
        );
        assertThat(pushCount).isEqualTo(1);

        Integer constraintCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pg_constraint WHERE conname = 'uq_push_subscriptions_endpoint'",
                Integer.class
        );
        assertThat(constraintCount).isEqualTo(1);

        Integer tableCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'rest_timers'",
                Integer.class
        );
        assertThat(tableCount).isEqualTo(1);
    }
}
