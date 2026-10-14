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
    private final RefreshTokenService refreshTokenService;
    private final AccountDeletionService accountDeletionService;
    private final UserService userService;
    
    @Value("${google.client-id:CHANGE_ME}")
    private String googleClientId;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    @Value("${app.cookie.same-site:None}")
    private String cookieSameSite;

    public AuthController(
            GoogleIdTokenVerifier verifier,
            JwtEncoder jwtEncoder,
            RefreshTokenService refreshTokenService,
            AccountDeletionService accountDeletionService,
            UserService userService) {
        this.verifier = verifier;
        this.jwtEncoder = jwtEncoder;
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
            String name = (String) tokenPayload.get("name");
            String picture = (String) tokenPayload.get("picture");

            userService.ensureUserExists(email, name, picture);

            String customToken = generateJwt(email, name, picture);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(email, name, picture);
            ResponseCookie springCookie = buildRefreshCookie(refreshToken.getPlainToken());

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, springCookie.toString())
                    .body(Map.of("token", customToken, "refreshToken", refreshToken.getPlainToken()));

        } catch (Exception e) {
            log.error("Failed to validate Google token", e);
            return ResponseEntity.status(401).body(Map.of("error", "Failed to validate token"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshtoken(
            @CookieValue(name = "refreshToken", required = false) String requestCookieRefreshToken,
            @RequestHeader(name = "X-Refresh-Token", required = false) String requestHeaderRefreshToken,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest request) {

        String requestRefreshToken = requestCookieRefreshToken;
        if (requestRefreshToken == null || requestRefreshToken.isBlank()) {
            if (body != null && body.get("refreshToken") != null && !body.get("refreshToken").isBlank()) {
                requestRefreshToken = body.get("refreshToken");
            } else if (requestHeaderRefreshToken != null && !requestHeaderRefreshToken.isBlank()) {
                requestRefreshToken = requestHeaderRefreshToken;
            }
        }

        log.info("Refresh request received, token present: {}", requestRefreshToken != null);
        
        if (requestRefreshToken == null || requestRefreshToken.isBlank()) {
            log.warn("Refresh token missing from cookie, header, and body");
            return ResponseEntity.status(401).body(Map.of("error", "Refresh token is missing"));
        }

        try {
            RefreshToken newRefreshToken = refreshTokenService.rotateRefreshToken(requestRefreshToken);
            String token = generateJwt(newRefreshToken.getEmail(), newRefreshToken.getName(), newRefreshToken.getPicture());
            log.info("Refresh token rotated successfully for user {}", newRefreshToken.getEmail());

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(newRefreshToken.getPlainToken()).toString())
                    .body(Map.of("token", token, "refreshToken", newRefreshToken.getPlainToken()));

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
                .sameSite(cookieSameSite)
                .build();
    }

    private ResponseCookie buildDeleteCookie() {
        return ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .sameSite(cookieSameSite)
                .build();
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @CookieValue(name = "refreshToken", required = false) String requestCookieRefreshToken,
            @RequestHeader(name = "X-Refresh-Token", required = false) String requestHeaderRefreshToken,
            @RequestBody(required = false) Map<String, String> body) {
        String tokenToDelete = requestCookieRefreshToken;
        if (tokenToDelete == null || tokenToDelete.isBlank()) {
            if (body != null && body.get("refreshToken") != null && !body.get("refreshToken").isBlank()) {
                tokenToDelete = body.get("refreshToken");
            } else if (requestHeaderRefreshToken != null && !requestHeaderRefreshToken.isBlank()) {
                tokenToDelete = requestHeaderRefreshToken;
            }
        }
        if (tokenToDelete != null) {
            refreshTokenService.findByToken(RefreshToken.hashToken(tokenToDelete)).ifPresent(token -> {
                refreshTokenService.delete(token);
            });
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

    @DeleteMapping("/account")
    public ResponseEntity<Map<String, String>> deleteAccount(@AuthenticationPrincipal Jwt jwt) {
        String email = extractEmail(jwt);
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(401).build();
        }
        accountDeletionService.wipeAccountData(email);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildDeleteCookie().toString())
                .body(Collections.singletonMap("message", "Account deleted successfully"));
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getConfig() {
        return ResponseEntity.ok(Map.of("googleClientId", googleClientId));
    }
}
