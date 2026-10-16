package com.ascension.controller;

import jakarta.servlet.http.HttpServletRequest;
import com.ascension.model.RefreshToken;
import com.ascension.service.RefreshTokenService;
import com.ascension.service.AccountDeletionService;
import com.ascension.service.UserService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.CookieValue;
import jakarta.annotation.PostConstruct;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final GoogleIdTokenVerifier verifier;
    private final JwtEncoder jwtEncoder;
    private final org.springframework.security.oauth2.jwt.JwtDecoder jwtDecoder;
    private final RefreshTokenService refreshTokenService;
    private final AccountDeletionService accountDeletionService;
    private final UserService userService;
    
    @Value("${google.client-id:CHANGE_ME}")
    private String googleClientId;

    @Value("${app.jwt.expiration-ms:900000}")
    private long jwtExpirationMs;

    @Value("${app.cookie.same-site:Lax}")
    private String cookieSameSite;

    @Value("${app.cors.allowed-origins:http://localhost:5173,https://ascension.raclos.es}")
    private String corsAllowedOrigins;

    public AuthController(
            GoogleIdTokenVerifier verifier,
            JwtEncoder jwtEncoder,
            org.springframework.security.oauth2.jwt.JwtDecoder jwtDecoder,
            RefreshTokenService refreshTokenService,
            AccountDeletionService accountDeletionService,
            UserService userService) {
        this.verifier = verifier;
        this.jwtEncoder = jwtEncoder;
        this.jwtDecoder = jwtDecoder;
        this.refreshTokenService = refreshTokenService;
        this.accountDeletionService = accountDeletionService;
        this.userService = userService;
    }

    private String generateJwt(String email, String name, String picture) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("ascension-backend")
                .issuedAt(now)
                .expiresAt(now.plus(jwtExpirationMs, ChronoUnit.MILLIS))
                .subject(email)
                .claim("email", email)
                .claim("name", name != null ? name : "")
                .claim("picture", picture != null ? picture : "")
                .build();

        org.springframework.security.oauth2.jose.jws.MacAlgorithm alg = org.springframework.security.oauth2.jose.jws.MacAlgorithm.HS256;
        org.springframework.security.oauth2.jwt.JwsHeader jwsHeader = org.springframework.security.oauth2.jwt.JwsHeader.with(alg).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).getTokenValue();
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload, HttpServletRequest request) {
        String googleToken = payload.get("token");
        if (googleToken == null || googleToken.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing token"));
        }

        try {
            GoogleIdToken idToken = verifier.verify(googleToken);
            if (idToken == null) {
                log.warn("Invalid Google token received");
                return ResponseEntity.status(401).body(Map.of("error", "Invalid Google token"));
            }

            GoogleIdToken.Payload tokenPayload = idToken.getPayload();
            if (!Boolean.TRUE.equals(tokenPayload.getEmailVerified())) {
                log.warn("Email not verified");
                return ResponseEntity.status(401).body(Map.of("error", "Email not verified"));
            }
            String email = tokenPayload.getEmail();
            if (email == null || email.isBlank()) {
                log.warn("Email is missing from Google token payload");
                return ResponseEntity.status(401).body(Map.of("error", "Email is required"));
            }
            String googleSub = tokenPayload.getSubject();
            if (googleSub == null || googleSub.isBlank()) {
                log.warn("Google sub is missing from token payload");
                return ResponseEntity.status(401).body(Map.of("error", "Google sub is required"));
            }

            // Identity verification: enforce google sub uniqueness and detect recycled emails
            // 1. If an existing user has this email, verify google_sub matches
            java.util.Optional<com.ascension.service.UserService.User> userByEmail = userService.findByEmail(email);
            if (userByEmail.isPresent()) {
                String existingSub = userByEmail.get().googleSub();
                if (existingSub != null && !existingSub.equals(googleSub)) {
                    log.error("SECURITY ALERT: Identity mismatch for email '{}'. Stored google_sub='{}', incoming google_sub='{}'. Possible recycled email or account takeover attempt.",
                            email, existingSub, googleSub);
                    return ResponseEntity.status(401).body(Map.of("error", "Security identity mismatch"));
                }
            }

            // 2. If an existing user has this google_sub, verify email matches
            java.util.Optional<com.ascension.service.UserService.User> userBySub = userService.findByGoogleSub(googleSub);
            if (userBySub.isPresent()) {
                String existingEmail = userBySub.get().email();
                if (existingEmail != null && !existingEmail.equalsIgnoreCase(email)) {
                    log.error("SECURITY ALERT: Identity mismatch for google_sub '{}'. Already assigned to email '{}', incoming email='{}'. Rejecting login.",
                            googleSub, existingEmail, email);
                    return ResponseEntity.status(401).body(Map.of("error", "Security identity mismatch"));
                }
            }

            String name = (String) tokenPayload.get("name");
            String picture = (String) tokenPayload.get("picture");

            // NOTE: Future architectural roadmap:
            // Currently user tables link via email as primary key. Migrating user-referencing tables
            // to a surrogate UUID (or UUID v7) primary key is planned as future architectural work
            // to decouple internal database foreign keys from mutable email addresses and OAuth subject identifiers.
            userService.ensureUserExists(email, name, picture, googleSub);

            String customToken = generateJwt(email, name, picture);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(email, name, picture);
            ResponseCookie springCookie = buildRefreshCookie(refreshToken.getPlainToken());

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, springCookie.toString())
                    .body(Map.of("token", customToken));

        } catch (Exception e) {
            log.error("Failed to validate Google token", e);
            return ResponseEntity.status(401).body(Map.of("error", "Failed to validate token"));
        }
    }

    private String getEffectiveSameSite() {
        if (cookieSameSite != null && "none".equalsIgnoreCase(cookieSameSite.trim())) {
            return "None";
        }
        if (cookieSameSite != null && "strict".equalsIgnoreCase(cookieSameSite.trim())) {
            return "Strict";
        }
        return "Lax";
    }

    private java.util.List<String> parseAllowedOrigins() {
        if (corsAllowedOrigins == null || corsAllowedOrigins.isBlank()) {
            return Collections.emptyList();
        }
        return java.util.Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    private boolean isOriginAllowed(HttpServletRequest request) {
        if (request == null) {
            return true;
        }
        String origin = request.getHeader("Origin");
        if (origin == null || origin.isBlank()) {
            return true;
        }
        String trimmedOrigin = origin.trim();
        java.util.List<String> allowed = parseAllowedOrigins();
        if (allowed.contains("*")) {
            return true;
        }
        return allowed.contains(trimmedOrigin);
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshtoken(
            @CookieValue(name = "refreshToken", required = false) String requestCookieRefreshToken,
            HttpServletRequest request) {

        if (!isOriginAllowed(request)) {
            log.warn("Forbidden Origin header on /api/auth/refresh: {}", request != null ? request.getHeader("Origin") : null);
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Forbidden origin"));
        }

        log.info("Refresh request received, token present in cookie: {}", requestCookieRefreshToken != null);
        
        if (requestCookieRefreshToken == null || requestCookieRefreshToken.isBlank()) {
            log.warn("Refresh token missing from cookie");
            return ResponseEntity.status(401).body(Map.of("error", "Refresh token is missing"));
        }

        try {
            RefreshToken newRefreshToken = refreshTokenService.rotateRefreshToken(requestCookieRefreshToken);
            String token = generateJwt(newRefreshToken.getEmail(), newRefreshToken.getName(), newRefreshToken.getPicture());
            log.info("Refresh token rotated successfully for user {}", newRefreshToken.getEmail());

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(newRefreshToken.getPlainToken()).toString())
                    .body(Map.of("token", token));

        } catch (com.ascension.exception.TokenRefreshException e) {
            return ResponseEntity.status(401)
                    .header(HttpHeaders.SET_COOKIE, buildDeleteCookie().toString())
                    .body(Map.of("error", e.getMessage()));
        }
    }

    private ResponseCookie buildRefreshCookie(String value) {
        return ResponseCookie.from("refreshToken", value)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(30L * 24 * 60 * 60)
                .sameSite(getEffectiveSameSite())
                .build();
    }

    private ResponseCookie buildDeleteCookie() {
        return ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .sameSite(getEffectiveSameSite())
                .build();
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @CookieValue(name = "refreshToken", required = false) String requestCookieRefreshToken,
            @RequestHeader(name = HttpHeaders.AUTHORIZATION, required = false) String authHeader,
            @AuthenticationPrincipal Jwt principalJwt,
            HttpServletRequest request) {

        if (!isOriginAllowed(request)) {
            log.warn("Forbidden Origin header on /api/auth/logout: {}", request != null ? request.getHeader("Origin") : null);
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Forbidden origin"));
        }

        if (principalJwt != null) {
            String email = extractEmail(principalJwt);
            if (email != null && !email.isBlank()) {
                userService.updateTokensValidAfter(email, Instant.now());
            }
        }
        if (requestCookieRefreshToken != null && !requestCookieRefreshToken.isBlank()) {
            refreshTokenService.findByToken(RefreshToken.hashToken(requestCookieRefreshToken)).ifPresent(token -> {
                userService.updateTokensValidAfter(token.getEmail(), Instant.now());
                refreshTokenService.delete(token);
            });
        }
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String tokenValue = authHeader.substring(7).trim();
            try {
                Jwt decoded = jwtDecoder.decode(tokenValue);
                String email = extractEmail(decoded);
                if (email != null && !email.isBlank()) {
                    userService.updateTokensValidAfter(email, Instant.now());
                }
            } catch (Exception e) {
                log.debug("Bearer token could not be decoded during logout: {}", e.getMessage());
            }
        }
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildDeleteCookie().toString())
                .body(Map.of("message", "Log out successful"));
    }

    private String extractEmail(Jwt jwt) {
        if (jwt == null) {
            return null;
        }
        String email = jwt.getClaimAsString("email");
        if (email != null && !email.isBlank()) {
            return email;
        }
        return jwt.getSubject();
    }

    @DeleteMapping({"/account", "/users/account"})
    public ResponseEntity<Map<String, String>> deleteAccount(@AuthenticationPrincipal Jwt jwt) {
        String email = extractEmail(jwt);
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(401).build();
        }
        userService.updateTokensValidAfter(email, Instant.now());
        accountDeletionService.wipeAccountData(email);
        userService.evictUser(email);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildDeleteCookie().toString())
                .body(Collections.singletonMap("message", "Account deleted successfully"));
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getConfig() {
        return ResponseEntity.ok(Map.of("googleClientId", googleClientId));
    }
}
