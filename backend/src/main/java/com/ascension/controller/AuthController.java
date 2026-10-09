package com.ascension.controller;

import jakarta.servlet.http.HttpServletRequest;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.time.Instant;
import com.ascension.model.RefreshToken;
import com.ascension.service.RefreshTokenService;
import com.ascension.service.AccountDeletionService;
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
import java.util.Collections;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private GoogleIdTokenVerifier verifier;

    @PostConstruct
    public void init() {
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }


    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    
    // Rate limiting seguro en memoria usando Caffeine (previene OOM)
    private static final int MAX_REQUESTS_PER_MINUTE = 10;
    
    private final Cache<String, AtomicInteger> rateLimitCache = Caffeine.newBuilder()
            .maximumSize(10_000) // Protege contra inyección infinita de IPs
            .expireAfterWrite(1, TimeUnit.MINUTES) // Ventana de 1 minuto
            .build();

    private final JwtEncoder jwtEncoder;
    private final RefreshTokenService refreshTokenService;
    private final AccountDeletionService accountDeletionService;
    
    @Value("${google.client-id:CHANGE_ME}")
    private String googleClientId;

    public AuthController(JwtEncoder jwtEncoder, RefreshTokenService refreshTokenService, AccountDeletionService accountDeletionService) {
        this.jwtEncoder = jwtEncoder;
        this.refreshTokenService = refreshTokenService;
        this.accountDeletionService = accountDeletionService;
    }

    private String generateJwt(String email, String name, String picture) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("ascension-backend")
                .issuedAt(now)
                .expiresAt(now.plus(15, ChronoUnit.MINUTES)) // JWT expira en 15 minutos
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
        if (isRateLimited(request)) {
            log.warn("Rate limit exceeded for login from IP: {}", request.getRemoteAddr());
            return ResponseEntity.status(429).body(Map.of("error", "Too many requests. Please try again later."));
        }

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
            String name = (String) tokenPayload.get("name");
            String picture = (String) tokenPayload.get("picture");

            String customToken = generateJwt(email, name, picture);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(email, name, picture);
            
            ResponseCookie springCookie = ResponseCookie.from("refreshToken", refreshToken.getPlainToken())
                    .httpOnly(true)
                    .secure(true) // Should be true in production, works in localhost
                    .path("/")
                    .maxAge(30L * 24 * 60 * 60)
                    .sameSite("Strict")
                    .build();

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, springCookie.toString())
                    .body(Map.of("token", customToken));

        } catch (Exception e) {
            log.error("Failed to validate Google token", e);
            return ResponseEntity.status(401).body(Map.of("error", "Failed to validate token"));
        }
    }

    @PostMapping("/refresh")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> refreshtoken(
            @CookieValue(name = "refreshToken", required = false) String requestRefreshToken,
            HttpServletRequest request) {
        if (isRateLimited(request)) {
            log.warn("Rate limit exceeded for refresh from IP: {}", request.getRemoteAddr());
            return ResponseEntity.status(429).body(Map.of("error", "Too many requests. Please try again later."));
        }

        log.info("Refresh request received, cookie present: {}", requestRefreshToken != null);
        
        if (requestRefreshToken == null || requestRefreshToken.isBlank()) {
            log.warn("Refresh token missing or blank from cookies");
            return ResponseEntity.status(401).body(Map.of("error", "Refresh token is missing from cookies"));
        }

        String hashedToken = RefreshToken.hashToken(requestRefreshToken);
        var optionalToken = refreshTokenService.findByToken(hashedToken);
        
        if (optionalToken.isEmpty()) {
            log.warn("Refresh token not found in database (hash prefix: {}...)", hashedToken.substring(0, 8));
            return ResponseEntity.status(401).body(Map.of("error", "Refresh token not found"));
        }

        RefreshToken refreshToken = optionalToken.get();
        
        // Check expiration
        if (refreshToken.getExpiryDate().compareTo(Instant.now()) < 0) {
            log.warn("Refresh token expired for user {}", refreshToken.getEmail());
            refreshTokenService.delete(refreshToken);
            return ResponseEntity.status(401).body(Map.of("error", "Refresh token expired"));
        }

        if (refreshToken.getReplacedAt() != null) {
            if (java.time.Instant.now().isBefore(refreshToken.getReplacedAt().plusSeconds(15))) {
                log.warn("Grace period: Refresh token reuse within 15s for user {}. Issuing JWT without new cookie.", refreshToken.getEmail());
                String token = generateJwt(refreshToken.getEmail(), refreshToken.getName(), refreshToken.getPicture());
                return ResponseEntity.ok().body(java.util.Map.of("token", token));
            }
            log.warn("Refresh token REUSE detected for user {}. Invalidating all sessions.", refreshToken.getEmail());
            refreshTokenService.deleteByEmail(refreshToken.getEmail());
            return ResponseEntity.status(401).body(java.util.Map.of("error", "Session expired. Please log in again."));
        }

        // Normal rotation: mark old token as replaced, create new one
        refreshToken.setReplacedAt(Instant.now());
        refreshTokenService.save(refreshToken);
        
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(refreshToken.getEmail(), refreshToken.getName(), refreshToken.getPicture());
        String token = generateJwt(newRefreshToken.getEmail(), newRefreshToken.getName(), newRefreshToken.getPicture());
        
        log.info("Refresh token rotated successfully for user {}", refreshToken.getEmail());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(newRefreshToken.getPlainToken()).toString())
                .body(Map.of("token", token));
    }

    private ResponseCookie buildRefreshCookie(String value) {
        return ResponseCookie.from("refreshToken", value)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(30L * 24 * 60 * 60)
                .sameSite("Strict")
                .build();
    }



    @PostMapping("/logout")
    public ResponseEntity<?> logout(@CookieValue(name = "refreshToken", required = false) String requestRefreshToken) {
        if (requestRefreshToken != null) {
            refreshTokenService.findByToken(RefreshToken.hashToken(requestRefreshToken)).ifPresent(token -> {
                refreshTokenService.delete(token);
            });
        }
        
        ResponseCookie deleteCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .sameSite("Strict")
                .build();
                
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                .body(Map.of("message", "Log out successful"));
    }

    @DeleteMapping("/account")
    public ResponseEntity<Map<String, String>> deleteAccount(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.status(401).build();
        }
        String email = jwt.getSubject();
        accountDeletionService.wipeAccountData(email);
        return ResponseEntity.ok(Collections.singletonMap("message", "Account deleted successfully"));
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getConfig() {
        return ResponseEntity.ok(Map.of("googleClientId", googleClientId));
    }

    /**
     * Comprueba si la IP ha superado el límite de peticiones.
     * @return true si está limitado (debe rechazar), false si puede continuar.
     */
    private boolean isRateLimited(HttpServletRequest request) {
        // Obtenemos la IP de forma segura. Si hay proxy, Spring debe configurarse 
        // con server.forward-headers-strategy=framework para resolver request.getRemoteAddr() correctamente.
        String ip = request.getRemoteAddr();
        
        AtomicInteger count = rateLimitCache.get(ip, k -> new AtomicInteger(0));
        return count.incrementAndGet() > MAX_REQUESTS_PER_MINUTE;
    }
}






