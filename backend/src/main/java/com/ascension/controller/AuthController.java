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

import com.ascension.exception.TokenRefreshException;
import com.ascension.service.UserService.User;
import com.ascension.util.PiiMasker;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private static final String REFRESH_COOKIE_PATH = "/api/auth";

    private final GoogleIdTokenVerifier verifier;
    private final JwtEncoder jwtEncoder;
    private final JwtDecoder jwtDecoder;
    private final RefreshTokenService refreshTokenService;
    private final AccountDeletionService accountDeletionService;
    private final UserService userService;
    
    @Value("${google.client-id:CHANGE_ME}")
    private String googleClientId;

    @Value("${app.jwt.expiration-ms:900000}")
    private long jwtExpirationMs;

    @Value("${app.cookie.same-site:Lax}")
    private String cookieSameSite;

    @Value("${app.cookie.secure:#{null}}")
    private Boolean cookieSecure;

    @Value("${app.cors.allowed-origins:http://localhost:5173,https://ascension.raclos.es}")
    private String corsAllowedOrigins;

    public AuthController(
            GoogleIdTokenVerifier verifier,
            JwtEncoder jwtEncoder,
            JwtDecoder jwtDecoder,
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

        MacAlgorithm alg = MacAlgorithm.HS256;
        JwsHeader jwsHeader = JwsHeader.with(alg).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).getTokenValue();
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload, HttpServletRequest request) {
        String googleToken = payload.get("token");
        if (googleToken == null || googleToken.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing token"));
        }

        GoogleIdToken idToken;
        try {
            idToken = verifier.verify(googleToken);
        } catch (java.security.GeneralSecurityException | IllegalArgumentException e) {
            log.warn("Google token verification failed", e);
            return ResponseEntity.status(401).body(Map.of("error", "Failed to validate token"));
        } catch (java.io.IOException e) {
            log.error("I/O exception while verifying Google token", e);
            throw new RuntimeException("I/O error during token verification", e);
        }

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
        Optional<User> userByEmail = userService.findByEmail(email);
        if (userByEmail.isPresent()) {
            String existingSub = userByEmail.get().googleSub();
            if (existingSub != null && !existingSub.equals(googleSub)) {
                log.error("SECURITY ALERT: Identity mismatch for account '{}'. Stored google_sub='{}', incoming google_sub='{}'. Possible account takeover attempt.",
                        PiiMasker.maskEmail(email), PiiMasker.maskSubject(existingSub), PiiMasker.maskSubject(googleSub));
                return ResponseEntity.status(401).body(Map.of("error", "Security identity mismatch"));
            }
        }

        // 2. If an existing user has this google_sub, verify email matches
        Optional<User> userBySub = userService.findByGoogleSub(googleSub);
        if (userBySub.isPresent()) {
            String existingEmail = userBySub.get().email();
            if (existingEmail != null && !existingEmail.equalsIgnoreCase(email)) {
                log.error("SECURITY ALERT: Identity mismatch for google_sub '{}'. Already assigned to account '{}', incoming account='{}'. Rejecting login.",
                        PiiMasker.maskSubject(googleSub), PiiMasker.maskEmail(existingEmail), PiiMasker.maskEmail(email));
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
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(email);
        ResponseCookie springCookie = buildRefreshCookie(refreshToken.getPlainToken(), request);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, springCookie.toString(), buildLegacyDeleteCookie(request).toString())
                .body(Map.of("token", customToken));
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

    private List<String> parseAllowedOrigins() {
        if (corsAllowedOrigins == null || corsAllowedOrigins.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(corsAllowedOrigins.split(","))
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
            // Browsers always send Origin on a cross-site POST; fall back to Referer and
            // reject requests that carry neither, since SameSite=Lax alone is the only other guard.
            origin = originFromReferer(request.getHeader("Referer"));
            if (origin == null) {
                return false;
            }
        }
        String trimmedOrigin = origin.trim();
        List<String> allowed = parseAllowedOrigins();
        if (allowed.contains("*")) {
            return true;
        }
        return allowed.contains(trimmedOrigin);
    }

    private static String originFromReferer(String referer) {
        if (referer == null || referer.isBlank()) {
            return null;
        }
        try {
            java.net.URI uri = java.net.URI.create(referer.trim());
            if (uri.getScheme() == null || uri.getHost() == null) {
                return null;
            }
            String port = uri.getPort() == -1 ? "" : ":" + uri.getPort();
            return uri.getScheme() + "://" + uri.getHost() + port;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshtoken(
            @CookieValue(name = "refreshToken", required = false) String requestCookieRefreshToken,
            HttpServletRequest request) {

        if (!isOriginAllowed(request)) {
            log.warn("Forbidden Origin header on /api/auth/refresh: {}", request != null ? request.getHeader("Origin") : null);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Forbidden origin"));
        }

        log.info("Refresh request received, token present in cookie: {}", requestCookieRefreshToken != null);
        
        if (requestCookieRefreshToken == null || requestCookieRefreshToken.isBlank()) {
            log.warn("Refresh token missing from cookie");
            return ResponseEntity.status(401).body(Map.of("error", "Refresh token is missing"));
        }

        try {
            RefreshToken newRefreshToken = refreshTokenService.rotateRefreshToken(requestCookieRefreshToken);
            String email = newRefreshToken.getEmail();

            // Read latest profile data from users table
            String name = "";
            String picture = "";
            Optional<User> userOpt = userService.findByEmail(email);
            if (userOpt.isPresent()) {
                name = userOpt.get().name() != null ? userOpt.get().name() : "";
                picture = userOpt.get().picture() != null ? userOpt.get().picture() : "";
            }

            String token = generateJwt(email, name, picture);
            log.info("Refresh token rotated successfully for user {}", PiiMasker.maskEmail(email));

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(newRefreshToken.getPlainToken(), request).toString(), buildLegacyDeleteCookie(request).toString())
                    .body(Map.of("token", token));

        } catch (TokenRefreshException e) {
            return ResponseEntity.status(401)
                    .header(HttpHeaders.SET_COOKIE, buildDeleteCookie(request).toString(), buildLegacyDeleteCookie(request).toString())
                    .body(Map.of("error", e.getMessage()));
        }
    }

    private boolean determineCookieSecure(HttpServletRequest request) {
        String sameSite = getEffectiveSameSite();
        if ("None".equalsIgnoreCase(sameSite)) {
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

    private ResponseCookie buildRefreshCookie(String value, HttpServletRequest request) {
        return ResponseCookie.from("refreshToken", value)
                .httpOnly(true)
                .secure(determineCookieSecure(request))
                .path(REFRESH_COOKIE_PATH)
                .maxAge(30L * 24 * 60 * 60)
                .sameSite(getEffectiveSameSite())
                .build();
    }

    private ResponseCookie buildDeleteCookie(HttpServletRequest request) {
        return buildDeleteCookie(request, REFRESH_COOKIE_PATH);
    }

    // Cookies issued before the path was narrowed live at "/"; expire them so the browser
    // does not keep sending a stale token next to the current one.
    private ResponseCookie buildLegacyDeleteCookie(HttpServletRequest request) {
        return buildDeleteCookie(request, "/");
    }

    private ResponseCookie buildDeleteCookie(HttpServletRequest request, String path) {
        return ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(determineCookieSecure(request))
                .path(path)
                .maxAge(0)
                .sameSite(getEffectiveSameSite())
                .build();
    }

    public ResponseEntity<?> logout(
            String requestCookieRefreshToken,
            String authHeader,
            Jwt principalJwt,
            HttpServletRequest request) {
        return logout(requestCookieRefreshToken, authHeader, false, principalJwt, request);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @CookieValue(name = "refreshToken", required = false) String requestCookieRefreshToken,
            @RequestHeader(name = HttpHeaders.AUTHORIZATION, required = false) String authHeader,
            @RequestParam(name = "allDevices", defaultValue = "false") boolean allDevices,
            @AuthenticationPrincipal Jwt principalJwt,
            HttpServletRequest request) {

        if (!isOriginAllowed(request)) {
            log.warn("Forbidden Origin header on /api/auth/logout: {}", request != null ? request.getHeader("Origin") : null);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Forbidden origin"));
        }

        if (allDevices) {
            String targetEmail = null;
            if (principalJwt != null) {
                targetEmail = com.ascension.util.SecurityUtils.extractEmail(principalJwt);
            } else if (authHeader != null && authHeader.startsWith("Bearer ")) {
                try {
                    Jwt decoded = jwtDecoder.decode(authHeader.substring(7).trim());
                    targetEmail = com.ascension.util.SecurityUtils.extractEmail(decoded);
                } catch (Exception e) {
                    log.debug("Bearer token could not be decoded during logout: {}", e.getMessage());
                }
            } else if (requestCookieRefreshToken != null && !requestCookieRefreshToken.isBlank()) {
                var found = refreshTokenService.findByToken(RefreshToken.hashToken(requestCookieRefreshToken));
                if (found.isPresent()) {
                    targetEmail = found.get().getEmail();
                }
            }

            if (targetEmail != null && !targetEmail.isBlank()) {
                userService.updateTokensValidAfter(targetEmail, Instant.now());
                refreshTokenService.deleteByEmail(targetEmail);
            }
        } else {
            if (requestCookieRefreshToken != null && !requestCookieRefreshToken.isBlank()) {
                refreshTokenService.findByToken(RefreshToken.hashToken(requestCookieRefreshToken)).ifPresent(token -> {
                    refreshTokenService.delete(token);
                    if (token.getFamilyId() != null && !token.getFamilyId().isBlank()) {
                        refreshTokenService.deleteByFamilyId(token.getFamilyId());
                    }
                });
            }
        }
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildDeleteCookie(request).toString(), buildLegacyDeleteCookie(request).toString())
                .body(Map.of("message", "Log out successful"));
    }

    @DeleteMapping({"/account", "/users/account"})
    public ResponseEntity<Map<String, String>> deleteAccount(@AuthenticationPrincipal Jwt jwt, HttpServletRequest request) {
        String email = com.ascension.util.SecurityUtils.extractEmail(jwt);
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(401).build();
        }
        userService.updateTokensValidAfter(email, Instant.now());
        accountDeletionService.wipeAccountData(email);
        userService.evictUser(email);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildDeleteCookie(request).toString(), buildLegacyDeleteCookie(request).toString())
                .body(Collections.singletonMap("message", "Account deleted successfully"));
    }

    public ResponseEntity<Map<String, String>> deleteAccount(Jwt jwt) {
        return deleteAccount(jwt, (HttpServletRequest) null);
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getConfig() {
        return ResponseEntity.ok(Map.of("googleClientId", googleClientId));
    }
}
