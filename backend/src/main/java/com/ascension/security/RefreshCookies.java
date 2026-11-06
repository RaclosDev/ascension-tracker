package com.ascension.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/** Builds the httpOnly refresh-token cookie and the cookies that clear it. */
@Component
public class RefreshCookies {

    private static final String NAME = "refreshToken";
    private static final String PATH = "/api/auth";
    // Cookies issued before the path was narrowed live at "/". They are expired on every response
    // that sets or clears the token, so the browser never sends a stale one next to the current one.
    private static final String LEGACY_PATH = "/";
    private static final long MAX_AGE_SECONDS = 30L * 24 * 60 * 60;

    @Value("${app.cookie.same-site:Lax}")
    private String cookieSameSite;

    @Value("${app.cookie.secure:#{null}}")
    private Boolean cookieSecure;

    /** Set-Cookie values that store a new refresh token. */
    public String[] issue(String token, HttpServletRequest request) {
        ResponseCookie cookie = ResponseCookie.from(NAME, token)
                .httpOnly(true)
                .secure(isSecure(request))
                .path(PATH)
                .maxAge(MAX_AGE_SECONDS)
                .sameSite(sameSite())
                .build();
        return new String[]{cookie.toString(), expired(LEGACY_PATH, request).toString()};
    }

    /** Set-Cookie values that remove the refresh token. */
    public String[] clear(HttpServletRequest request) {
        return new String[]{expired(PATH, request).toString(), expired(LEGACY_PATH, request).toString()};
    }

    private ResponseCookie expired(String path, HttpServletRequest request) {
        return ResponseCookie.from(NAME, "")
                .httpOnly(true)
                .secure(isSecure(request))
                .path(path)
                .maxAge(0)
                .sameSite(sameSite())
                .build();
    }

    private String sameSite() {
        String value = cookieSameSite == null ? "" : cookieSameSite.trim();
        if ("none".equalsIgnoreCase(value)) {
            return "None";
        }
        if ("strict".equalsIgnoreCase(value)) {
            return "Strict";
        }
        return "Lax";
    }

    private boolean isSecure(HttpServletRequest request) {
        if ("None".equals(sameSite())) {
            return true;
        }
        if (cookieSecure != null) {
            return cookieSecure;
        }
        if (request == null) {
            return true;
        }
        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        if (forwardedProto != null) {
            return "https".equalsIgnoreCase(forwardedProto.trim());
        }
        return request.isSecure();
    }
}
