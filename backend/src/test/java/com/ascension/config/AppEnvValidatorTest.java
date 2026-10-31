package com.ascension.config;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertThrows;

class AppEnvValidatorTest {

    @org.junit.jupiter.params.ParameterizedTest
    @org.junit.jupiter.params.provider.ValueSource(strings = {"prod,db", "db, prod"})
    void validateEnvVariables_prodProfileWithWildcardCors_ThrowsException(String profiles) {
        AppEnvValidator validator = new AppEnvValidator();
        ReflectionTestUtils.setField(validator, "googleClientId", "valid-id");
        ReflectionTestUtils.setField(validator, "geminiApiKey", "valid-key");
        ReflectionTestUtils.setField(validator, "activeProfile", profiles);
        ReflectionTestUtils.setField(validator, "corsOrigins", "*");

        assertThrows(IllegalStateException.class, validator::validateEnvVariables);
    }

    @Test
    void validateEnvVariables_fatsecretWithChangeMe_throwsException() {
        AppEnvValidator validator = new AppEnvValidator();
        ReflectionTestUtils.setField(validator, "googleClientId", "valid-id");
        ReflectionTestUtils.setField(validator, "geminiApiKey", "valid-key");
        ReflectionTestUtils.setField(validator, "activeProfile", "dev");
        ReflectionTestUtils.setField(validator, "corsOrigins", "http://localhost:5173");
        ReflectionTestUtils.setField(validator, "fatsecretClientId", "CHANGE_ME");

        assertThrows(IllegalStateException.class, validator::validateEnvVariables);
    }

    @Test
    void validateEnvVariables_vapidWithChangeMe_throwsException() {
        AppEnvValidator validator = new AppEnvValidator();
        ReflectionTestUtils.setField(validator, "googleClientId", "valid-id");
        ReflectionTestUtils.setField(validator, "geminiApiKey", "valid-key");
        ReflectionTestUtils.setField(validator, "activeProfile", "dev");
        ReflectionTestUtils.setField(validator, "corsOrigins", "http://localhost:5173");
        ReflectionTestUtils.setField(validator, "vapidPublicKey", "CHANGE_ME");

        assertThrows(IllegalStateException.class, validator::validateEnvVariables);
    }

    @Test
    void validateEnvVariables_validConfig_doesNotThrow() {
        AppEnvValidator validator = new AppEnvValidator();
        ReflectionTestUtils.setField(validator, "googleClientId", "valid-id");
        ReflectionTestUtils.setField(validator, "geminiApiKey", "valid-key");
        ReflectionTestUtils.setField(validator, "activeProfile", "dev");
        ReflectionTestUtils.setField(validator, "corsOrigins", "http://localhost:5173");
        ReflectionTestUtils.setField(validator, "fatsecretClientId", "valid-fs-id");
        ReflectionTestUtils.setField(validator, "fatsecretClientSecret", "valid-fs-secret");
        ReflectionTestUtils.setField(validator, "vapidPublicKey", "valid-vapid-pub");
        ReflectionTestUtils.setField(validator, "vapidPrivateKey", "valid-vapid-priv");

        org.junit.jupiter.api.Assertions.assertDoesNotThrow(validator::validateEnvVariables);
    }
}
