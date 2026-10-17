package com.ascension.config;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FlywayConfigTest {

    @Mock
    private Flyway flyway;

    @Test
    void flywayMigrationStrategy_whenRepairDisabled_migratesWithoutRepair() {
        FlywayConfig config = new FlywayConfig();
        ReflectionTestUtils.setField(config, "repairEnabled", false);
        ReflectionTestUtils.setField(config, "activeProfiles", "dev");

        config.flywayMigrationStrategy().migrate(flyway);

        verify(flyway, never()).repair();
        verify(flyway).migrate();
    }

    @Test
    void flywayMigrationStrategy_whenRepairEnabledInNonProd_executesRepairAndMigrate() {
        FlywayConfig config = new FlywayConfig();
        ReflectionTestUtils.setField(config, "repairEnabled", true);
        ReflectionTestUtils.setField(config, "activeProfiles", "dev,test");

        config.flywayMigrationStrategy().migrate(flyway);

        verify(flyway).repair();
        verify(flyway).migrate();
    }

    @Test
    void flywayMigrationStrategy_whenRepairEnabledInProd_skipsRepairAndExecutesMigrate() {
        FlywayConfig config = new FlywayConfig();
        ReflectionTestUtils.setField(config, "repairEnabled", true);
        ReflectionTestUtils.setField(config, "activeProfiles", "prod,db");

        config.flywayMigrationStrategy().migrate(flyway);

        verify(flyway, never()).repair();
        verify(flyway).migrate();
    }
}
