package com.ascension.util;

import org.springframework.security.oauth2.jwt.Jwt;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static String extractEmail(Jwt jwt) {
        if (jwt == null) {
            return null;
        }
        String email = jwt.getClaimAsString("email");
        if (email == null || email.isBlank()) {
            email = jwt.getSubject();
        }
        if (email == null || email.isBlank()) {
            return null;
        }
        return email.trim().toLowerCase(java.util.Locale.ROOT);
    }
}
