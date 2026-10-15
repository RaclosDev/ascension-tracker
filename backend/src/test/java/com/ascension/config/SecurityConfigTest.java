package com.ascension.config;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class SecurityConfigTest {

    @Test
    void validateSecret_shouldNotThrowExceptionIfSecretIsValid() {
        SecurityConfig config = new SecurityConfig();
        ReflectionTestUtils.setField(config, "jwtSecret", "4f8b9e2a1d6c8e7f0b5a3c2e1d4f6a8b9c0e2d4f6a8b0c2e4d6f8a0b2c4e6f8a");

        assertDoesNotThrow(config::validateSecret);
    }

    @Test
    void validateSecret_throwsWhenNullOrBlank() {
        SecurityConfig config = new SecurityConfig();
        ReflectionTestUtils.setField(config, "jwtSecret", null);
        assertThatThrownBy(config::validateSecret)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");

        ReflectionTestUtils.setField(config, "jwtSecret", "   ");
        assertThatThrownBy(config::validateSecret)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    void validateSecret_throwsWhenShorterThan32Bytes() {
        SecurityConfig config = new SecurityConfig();
        ReflectionTestUtils.setField(config, "jwtSecret", "short_secret_under_32_bytes!");

        assertThatThrownBy(config::validateSecret)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 32 bytes");
    }

    @Test
    void validateSecret_throwsWhenContainingChangeMe() {
        SecurityConfig config = new SecurityConfig();
        ReflectionTestUtils.setField(config, "jwtSecret", "CHANGE_ME_NOW_WITH_MORE_THAN_32_BYTES_OF_DATA");

        assertThatThrownBy(config::validateSecret)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("CHANGE_ME");
    }

    @Test
    void validateSecret_throwsWhenContainingSuperSecret() {
        SecurityConfig config = new SecurityConfig();
        ReflectionTestUtils.setField(config, "jwtSecret", "my_super_secret_jwt_key_that_is_very_long_indeed");

        assertThatThrownBy(config::validateSecret)
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void validateSecret_throwsWhenContainingYour() {
        SecurityConfig config = new SecurityConfig();
        ReflectionTestUtils.setField(config, "jwtSecret", "your_secret_key_here_must_be_32_bytes_at_least");

        assertThatThrownBy(config::validateSecret)
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void validateSecret_throwsWhenContainingTesting() {
        SecurityConfig config = new SecurityConfig();
        ReflectionTestUtils.setField(config, "jwtSecret", "TESTING_KEY_FOR_JWT_THAT_MEETS_LENGTH_REQUIREMENTS");

        assertThatThrownBy(config::validateSecret)
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void validateSecret_throwsWhenContainingExample() {
        SecurityConfig config = new SecurityConfig();
        ReflectionTestUtils.setField(config, "jwtSecret", "example_jwt_secret_key_with_sufficient_length_padding");

        assertThatThrownBy(config::validateSecret)
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void validateSecret_throwsWhenLowEntropyOrRepeatedChars() {
        SecurityConfig config = new SecurityConfig();
        ReflectionTestUtils.setField(config, "jwtSecret", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

        assertThatThrownBy(config::validateSecret)
                .isInstanceOf(IllegalStateException.class);

        ReflectionTestUtils.setField(config, "jwtSecret", "12121212121212121212121212121212");
        assertThatThrownBy(config::validateSecret)
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void corsConfigurationSource_trimsOriginsProperly() {
        SecurityConfig config = new SecurityConfig();
        ReflectionTestUtils.setField(config, "allowedOrigins", "http://localhost:5173 , https://ascension.raclos.es  ");

        org.springframework.web.cors.CorsConfigurationSource source = config.corsConfigurationSource();
        org.springframework.mock.web.MockHttpServletRequest request = new org.springframework.mock.web.MockHttpServletRequest();
        request.setRequestURI("/api/version");
        org.springframework.web.cors.CorsConfiguration corsConfig = source.getCorsConfiguration(request);

        org.junit.jupiter.api.Assertions.assertNotNull(corsConfig);
        org.junit.jupiter.api.Assertions.assertEquals(
                java.util.List.of("http://localhost:5173", "https://ascension.raclos.es"),
                corsConfig.getAllowedOrigins()
        );
    }

    @Test
    void corsConfigurationSource_handlesWildcardProperly() {
        SecurityConfig config = new SecurityConfig();
        ReflectionTestUtils.setField(config, "allowedOrigins", " * ");

        org.springframework.web.cors.CorsConfigurationSource source = config.corsConfigurationSource();
        org.springframework.mock.web.MockHttpServletRequest request = new org.springframework.mock.web.MockHttpServletRequest();
        request.setRequestURI("/api/version");
        org.springframework.web.cors.CorsConfiguration corsConfig = source.getCorsConfiguration(request);

        org.junit.jupiter.api.Assertions.assertNotNull(corsConfig);
        org.junit.jupiter.api.Assertions.assertEquals(
                java.util.List.of("*"),
                corsConfig.getAllowedOriginPatterns()
        );
    }
}
