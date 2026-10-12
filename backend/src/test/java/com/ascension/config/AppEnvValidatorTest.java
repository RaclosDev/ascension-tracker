package com.ascension.config;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertThrows;

class AppEnvValidatorTest {

    @Test
    void validateEnvVariables_prodProfileWithWildcardCors_ThrowsException() {
        AppEnvValidator validator = new AppEnvValidator();
        ReflectionTestUtils.setField(validator, "googleClientId", "valid-id");
        ReflectionTestUtils.setField(validator, "geminiApiKey", "valid-key");
        ReflectionTestUtils.setField(validator, "activeProfile", "prod,db");
        ReflectionTestUtils.setField(validator, "corsOrigins", "*");

        assertThrows(IllegalStateException.class, validator::validateEnvVariables);
    }
}
