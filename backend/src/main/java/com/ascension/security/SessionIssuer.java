package com.ascension.security;

import com.ascension.model.RefreshToken;
import com.ascension.service.RefreshTokenService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.Map;

/** Opens a session after any kind of sign-in: access token in the body, refresh token in its cookie. */
@Component
public class SessionIssuer {

    private final AccessTokenIssuer accessTokens;
    private final RefreshTokenService refreshTokenService;
    private final RefreshCookies refreshCookies;

    public SessionIssuer(AccessTokenIssuer accessTokens, RefreshTokenService refreshTokenService,
                         RefreshCookies refreshCookies) {
        this.accessTokens = accessTokens;
        this.refreshTokenService = refreshTokenService;
        this.refreshCookies = refreshCookies;
    }

    public ResponseEntity<Map<String, String>> open(String email, String name, String picture, HttpServletRequest request) {
        String accessToken = accessTokens.issue(email, name, picture);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(email);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookies.issue(refreshToken.getPlainToken(), request))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(Map.of("token", accessToken));
    }
}
