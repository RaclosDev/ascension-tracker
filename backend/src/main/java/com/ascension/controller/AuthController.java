package com.ascension.controller;

import com.ascension.model.RefreshToken;
import com.ascension.service.RefreshTokenService;
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
    private final JwtEncoder jwtEncoder;
    private final RefreshTokenService refreshTokenService;
    
    @Value("${google.client-id:CHANGE_ME}")
    private String googleClientId;

    public AuthController(JwtEncoder jwtEncoder, RefreshTokenService refreshTokenService) {
        this.jwtEncoder = jwtEncoder;
        this.refreshTokenService = refreshTokenService;
    }

    private String generateJwt(String email, String name, String picture) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("ascension-backend")
                .issuedAt(now)
                .expiresAt(now.plus(15, ChronoUnit.MINUTES)) // JWT expira en 15 minutos
                .subject(email)
                .claim("email", email)
                .claim("name", name)
                .claim("picture", picture)
                .build();

        org.springframework.security.oauth2.jose.jws.MacAlgorithm alg = org.springframework.security.oauth2.jose.jws.MacAlgorithm.HS256;
        org.springframework.security.oauth2.jwt.JwsHeader jwsHeader = org.springframework.security.oauth2.jwt.JwsHeader.with(alg).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).getTokenValue();
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
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
            String email = tokenPayload.getEmail();
            String name = (String) tokenPayload.get("name");
            String picture = (String) tokenPayload.get("picture");

            String customToken = generateJwt(email, name, picture);
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(email, name, picture);
            
            Map<String, String> result = new HashMap<>();
            result.put("token", customToken);
            result.put("refreshToken", refreshToken.getPlainToken());
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Failed to validate Google token", e);
            return ResponseEntity.status(401).body(Map.of("error", "Failed to validate token"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshtoken(@RequestBody Map<String, String> request) {
        String requestRefreshToken = request.get("refreshToken");
        if (requestRefreshToken == null) return ResponseEntity.badRequest().body("Refresh token is missing");

        return refreshTokenService.findByToken(RefreshToken.hashToken(requestRefreshToken))
                .map(refreshTokenService::verifyExpiration)
                .map(refreshToken -> {
                    String token = generateJwt(refreshToken.getEmail(), refreshToken.getName(), refreshToken.getPicture());
                    // Opcional: Rotar el refresh token
                    RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(refreshToken.getEmail(), refreshToken.getName(), refreshToken.getPicture());
                    
                    Map<String, String> response = new HashMap<>();
                    response.put("token", token);
                    response.put("refreshToken", newRefreshToken.getPlainToken());
                    return ResponseEntity.ok(response);
                })
                .orElseThrow(() -> new com.ascension.exception.TokenRefreshException("Refresh token is not in database!"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody Map<String, String> request) {
        String requestRefreshToken = request.get("refreshToken");
        if (requestRefreshToken == null) return ResponseEntity.badRequest().body("Refresh token is missing");
        refreshTokenService.findByToken(RefreshToken.hashToken(requestRefreshToken)).ifPresent(token -> {
                refreshTokenService.deleteByEmail(token.getEmail());
            });
        return ResponseEntity.ok(Map.of("message", "Log out successful"));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity.status(403).body(Map.of("error", ex.getMessage()));
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getConfig() {
        return ResponseEntity.ok(Map.of("googleClientId", googleClientId));
    }
}






