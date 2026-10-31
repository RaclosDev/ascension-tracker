package com.ascension.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

@Configuration
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

    @Value("${app.flyway.repair:false}")
    private boolean repairEnabled;

    @Value("${spring.profiles.active:default}")
    private String activeProfiles;

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            boolean isProd = Arrays.stream(activeProfiles.split(","))
                    .map(String::trim)
                    .anyMatch("prod"::equalsIgnoreCase);

            if (repairEnabled && !isProd) {
                log.info("Executing flyway.repair() as repair is enabled in non-production profile.");
                flyway.repair();
            } else if (isProd && repairEnabled) {
                log.warn("flyway.repair() was requested but skipped because active profile is 'prod'.");
            }
            flyway.migrate();
        };
    }
}
