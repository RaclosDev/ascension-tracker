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
