package com.ascension.util;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class SecurityUtilsTest {

    @Test
    void extractEmail_nullJwt_returnsNull() {
        assertNull(SecurityUtils.extractEmail(null));
    }

    @Test
    void extractEmail_withEmailClaim_returnsNormalizedEmail() {
        Jwt jwt = new Jwt(
                "token",
                Instant.now(),
                Instant.now().plusSeconds(900),
                Map.of("alg", "HS256"),
                Map.of("email", " User@Example.COM ", "sub", "subject-id")
        );
        assertEquals("user@example.com", SecurityUtils.extractEmail(jwt));
    }

    @Test
    void extractEmail_withSubjectFallback_returnsNormalizedSubject() {
        Jwt jwt = new Jwt(
                "token",
                Instant.now(),
                Instant.now().plusSeconds(900),
                Map.of("alg", "HS256"),
                Map.of("sub", " Fallback@Example.COM ")
        );
        assertEquals("fallback@example.com", SecurityUtils.extractEmail(jwt));
    }

    @Test
    void extractEmail_blankClaims_returnsNull() {
        Jwt jwt = new Jwt(
                "token",
                Instant.now(),
                Instant.now().plusSeconds(900),
                Map.of("alg", "HS256"),
                Map.of("email", "   ", "sub", "  ")
        );
        assertNull(SecurityUtils.extractEmail(jwt));
    }
}
