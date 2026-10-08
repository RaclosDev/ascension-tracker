package com.ascension.config;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class SecurityConfigTest {

    @Test
    void validateSecret_shouldNotThrowExceptionIfSecretIsValid() {
        SecurityConfig config = new SecurityConfig();
        ReflectionTestUtils.setField(config, "jwtSecret", "this_is_a_very_long_secret_that_is_at_least_32_bytes");

        assertDoesNotThrow(config::validateSecret);
    }
}
