package com.ascension.controller;

import com.ascension.dto.LoginRequest;
import com.ascension.exception.TokenRefreshException;
import com.ascension.model.RefreshToken;
import com.ascension.security.AccessTokenIssuer;
import com.ascension.security.RefreshCookies;
import com.ascension.security.TrustedOrigins;
import com.ascension.service.AccountDeletionService;
import com.ascension.service.RefreshTokenService;
import com.ascension.service.UserService;
import com.ascension.service.UserService.User;
import com.ascension.util.Emails;
import com.ascension.util.PiiMasker;
import com.ascension.util.SecurityUtils;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final GoogleIdTokenVerifier verifier;
    private final JwtDecoder jwtDecoder;
    private final RefreshTokenService refreshTokenService;
    private final AccountDeletionService accountDeletionService;
    private final UserService userService;
    private final AccessTokenIssuer accessTokens;
    private final RefreshCookies refreshCookies;
    private final TrustedOrigins trustedOrigins;

    @Value("${google.client-id:CHANGE_ME}")
    private String googleClientId;

    public AuthController(
            GoogleIdTokenVerifier verifier,
            JwtDecoder jwtDecoder,
            RefreshTokenService refreshTokenService,
            AccountDeletionService accountDeletionService,
            UserService userService,
            AccessTokenIssuer accessTokens,
            RefreshCookies refreshCookies,
            TrustedOrigins trustedOrigins) {
        this.verifier = verifier;
        this.jwtDecoder = jwtDecoder;
        this.refreshTokenService = refreshTokenService;
        this.accountDeletionService = accountDeletionService;
        this.userService = userService;
        this.accessTokens = accessTokens;
        this.refreshCookies = refreshCookies;
        this.trustedOrigins = trustedOrigins;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest payload, HttpServletRequest request) {
        String googleToken = payload == null ? null : payload.token();
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
        String rawEmail = tokenPayload.getEmail();
        if (rawEmail == null || rawEmail.isBlank()) {
            log.warn("Email is missing from Google token payload");
            return ResponseEntity.status(401).body(Map.of("error", "Email is required"));
        }
        // users.email is stored lower-case and every foreign key to it is case-sensitive.
        String email = Emails.normalize(rawEmail);
        String googleSub = tokenPayload.getSubject();
        if (googleSub == null || googleSub.isBlank()) {
            log.warn("Google sub is missing from token payload");
            return ResponseEntity.status(401).body(Map.of("error", "Google sub is required"));
        }

        // An email bound to a different google_sub is a recycled address: reject the login.
        Optional<User> userByEmail = userService.findByEmail(email);
        if (userByEmail.isPresent()) {
            if (userService.hasUnverifiedEmail(email)) {
                return ResponseEntity.status(409).body(Map.of("error", "Este email ya tiene una cuenta. Entra con email y contraseña."));
            }
            String existingSub = userByEmail.get().googleSub();
            if (existingSub != null && !existingSub.equals(googleSub)) {
                log.error("SECURITY ALERT: Identity mismatch for account '{}'. Stored google_sub='{}', incoming google_sub='{}'. Possible account takeover attempt.",
                        PiiMasker.maskEmail(email), PiiMasker.maskSubject(existingSub), PiiMasker.maskSubject(googleSub));
                return ResponseEntity.status(401).body(Map.of("error", "Security identity mismatch"));
            }
        }

        // A google_sub that owns an account under another email means the user changed their
        // Google address: move the account unless the new email is taken.
        Optional<User> userBySub = userService.findByGoogleSub(googleSub);
        if (userBySub.isPresent()) {
            String existingEmail = userBySub.get().email();
            if (existingEmail != null && !existingEmail.equalsIgnoreCase(email)) {
                if (userByEmail.isPresent()) {
                    log.error("SECURITY ALERT: google_sub '{}' owns account '{}' but its new address '{}' already belongs to another account. Rejecting login.",
                            PiiMasker.maskSubject(googleSub), PiiMasker.maskEmail(existingEmail), PiiMasker.maskEmail(email));
                    return ResponseEntity.status(401).body(Map.of("error", "Security identity mismatch"));
                }
                userService.changeEmail(googleSub, existingEmail, email);
            }
        }

        String name = (String) tokenPayload.get("name");
        String picture = (String) tokenPayload.get("picture");

        // User tables are keyed by email; changeEmail above has already moved a renamed account.
        userService.ensureUserExists(email, name, picture, googleSub);

        String accessToken = accessTokens.issue(email, name, picture);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(email);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookies.issue(refreshToken.getPlainToken(), request))
                .body(Map.of("token", accessToken));
    }

    @PostMapping(value = "/login/redirect", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<Void> loginRedirect(
            @RequestParam(name = "credential", required = false) String credential,
            @RequestParam(name = "g_csrf_token", required = false) String bodyCsrf,
            @CookieValue(name = "g_csrf_token", required = false) String cookieCsrf,
            HttpServletRequest request) {
        if (credential == null || credential.isBlank() || bodyCsrf == null || bodyCsrf.isBlank()
                || cookieCsrf == null || cookieCsrf.isBlank()
                || !MessageDigest.isEqual(
                        bodyCsrf.getBytes(StandardCharsets.UTF_8), cookieCsrf.getBytes(StandardCharsets.UTF_8))) {
            log.warn("Rejected Google redirect with missing credential or invalid CSRF token");
            return redirectLoginError();
        }

        ResponseEntity<?> result = login(new LoginRequest(credential), request);
        if (!result.getStatusCode().is2xxSuccessful()) {
            return redirectLoginError();
        }
        return ResponseEntity.status(HttpStatus.SEE_OTHER)
                .header(HttpHeaders.LOCATION, "/")
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .header(HttpHeaders.SET_COOKIE, result.getHeaders().getOrEmpty(HttpHeaders.SET_COOKIE).toArray(String[]::new))
                .build();
    }

    private ResponseEntity<Void> redirectLoginError() {
        return ResponseEntity.status(HttpStatus.SEE_OTHER)
                .header(HttpHeaders.LOCATION, "/login?authError=google")
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshtoken(
            @CookieValue(name = "refreshToken", required = false) String requestCookieRefreshToken,
            HttpServletRequest request) {

        if (!trustedOrigins.allows(request)) {
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

            String name = "";
            String picture = "";
            Optional<User> userOpt = userService.findByEmail(email);
            if (userOpt.isPresent()) {
                name = userOpt.get().name() != null ? userOpt.get().name() : "";
                picture = userOpt.get().picture() != null ? userOpt.get().picture() : "";
            }

            String token = accessTokens.issueForRefresh(email, name, picture, newRefreshToken.getAccessTokenSecurityVersion());
            log.info("Refresh token rotated successfully for user {}", PiiMasker.maskEmail(email));

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, refreshCookies.issue(newRefreshToken.getPlainToken(), request))
                    .body(Map.of("token", token));

        } catch (TokenRefreshException e) {
            return ResponseEntity.status(401)
                    .header(HttpHeaders.SET_COOKIE, refreshCookies.clear(request))
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @CookieValue(name = "refreshToken", required = false) String requestCookieRefreshToken,
            @RequestHeader(name = HttpHeaders.AUTHORIZATION, required = false) String authHeader,
            @RequestParam(name = "allDevices", defaultValue = "false") boolean allDevices,
            @AuthenticationPrincipal Jwt principalJwt,
            HttpServletRequest request) {

        if (!trustedOrigins.allows(request)) {
            log.warn("Forbidden Origin header on /api/auth/logout: {}", request != null ? request.getHeader("Origin") : null);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Forbidden origin"));
        }

        if (allDevices) {
            String targetEmail = null;
            if (principalJwt != null) {
                targetEmail = SecurityUtils.extractEmail(principalJwt);
            } else if (authHeader != null && authHeader.startsWith("Bearer ")) {
                try {
                    Jwt decoded = jwtDecoder.decode(authHeader.substring(7).trim());
                    targetEmail = SecurityUtils.extractEmail(decoded);
                } catch (org.springframework.security.oauth2.jwt.JwtException | IllegalArgumentException e) {
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
        } else if (requestCookieRefreshToken != null && !requestCookieRefreshToken.isBlank()) {
            refreshTokenService.findByToken(RefreshToken.hashToken(requestCookieRefreshToken)).ifPresent(token -> {
                refreshTokenService.delete(token);
                if (token.getFamilyId() != null && !token.getFamilyId().isBlank()) {
                    refreshTokenService.deleteByFamilyId(token.getFamilyId());
                }
            });
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookies.clear(request))
                .body(Map.of("message", "Log out successful"));
    }

    @DeleteMapping("/account")
    public ResponseEntity<Map<String, String>> deleteAccount(@AuthenticationPrincipal Jwt jwt, HttpServletRequest request) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(401).build();
        }
        userService.updateTokensValidAfter(email, Instant.now());
        accountDeletionService.wipeAccountData(email);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookies.clear(request))
                .body(Map.of("message", "Account deleted successfully"));
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getConfig() {
        return ResponseEntity.ok(Map.of("googleClientId", googleClientId));
    }
}
