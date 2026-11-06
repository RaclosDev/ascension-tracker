package com.ascension.security;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Origin check for the cookie-authenticated auth endpoints (refresh, logout). SameSite=Lax is the
 * only other guard, so a request that carries neither Origin nor Referer is rejected.
 */
@Component
public class TrustedOrigins {

    private final List<String> allowed;

    public TrustedOrigins(
            @Value("${app.cors.allowed-origins:http://localhost:5173,https://ascension.raclos.es}") String origins) {
        this.allowed = origins == null ? List.of() : Arrays.stream(origins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    public boolean allows(HttpServletRequest request) {
        if (request == null) {
            return true;
        }
        String origin = request.getHeader("Origin");
        if (origin == null || origin.isBlank()) {
            origin = originFromReferer(request.getHeader("Referer"));
            if (origin == null) {
                return false;
            }
        }
        return allowed.contains("*") || allowed.contains(origin.trim());
    }

    private static String originFromReferer(String referer) {
        if (referer == null || referer.isBlank()) {
            return null;
        }
        try {
            URI uri = URI.create(referer.trim());
            if (uri.getScheme() == null || uri.getHost() == null) {
                return null;
            }
            String port = uri.getPort() == -1 ? "" : ":" + uri.getPort();
            return uri.getScheme() + "://" + uri.getHost() + port;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
