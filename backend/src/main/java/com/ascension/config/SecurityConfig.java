package com.ascension.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.Customizer;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    public static final String CSP_POLICY = "default-src 'self'; script-src 'self' https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://lh3.googleusercontent.com https://images.openfoodfacts.org; connect-src 'self' https://ascension-backend-7dd8e6190a75.herokuapp.com https://ascension.raclos.es https://accounts.google.com; frame-src https://accounts.google.com; media-src 'self' data: blob:; worker-src 'self' blob:; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

    public static final String PERMISSIONS_POLICY = "camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=()";

    @Value("${app.jwt.secret:CHANGE_ME}")
    private String jwtSecret;

    @Value("${app.cors.allowed-origins:http://localhost:5173,https://ascension.raclos.es}")
    private String allowedOrigins;

    @jakarta.annotation.PostConstruct
    public void validateSecret() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalStateException("FATAL: JWT_SECRET must be set and cannot be blank.");
        }
        if (jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("FATAL: JWT_SECRET must be at least 32 bytes long for HS256.");
        }
        String lower = jwtSecret.toLowerCase(java.util.Locale.ROOT);
        if (lower.contains("change_me")) {
            throw new IllegalStateException("FATAL: JWT_SECRET must not be or contain the placeholder 'CHANGE_ME'.");
        }
        if (lower.contains("super_secret") || lower.contains("your_") || lower.contains("testing") || lower.contains("example")) {
            throw new IllegalStateException("FATAL: JWT_SECRET contains an insecure template or test keyword ('super_secret', 'your_', 'testing', 'example').");
        }
        if (jwtSecret.chars().distinct().count() < 4 || calculateEntropy(jwtSecret) < 2.5) {
            throw new IllegalStateException("FATAL: JWT_SECRET has low entropy or repetitive characters. Use a cryptographically secure random key.");
        }
    }

    private static double calculateEntropy(String s) {
        if (s == null || s.isEmpty()) {
            return 0.0;
        }
        java.util.Map<Character, Integer> freqMap = new java.util.HashMap<>();
        for (char c : s.toCharArray()) {
            freqMap.put(c, freqMap.getOrDefault(c, 0) + 1);
        }
        double entropy = 0.0;
        double len = s.length();
        for (int count : freqMap.values()) {
            double p = count / len;
            entropy -= p * (Math.log(p) / Math.log(2));
        }
        return entropy;
    }

    // Auth endpoints: NO JWT filter at all — pure cookie-based refresh
    @Bean
    @org.springframework.core.annotation.Order(1)
    public SecurityFilterChain authFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/api/auth/login", "/api/auth/refresh", "/api/auth/logout", "/api/auth/config")
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .sessionManagement(session -> session.sessionCreationPolicy(
                org.springframework.security.config.http.SessionCreationPolicy.STATELESS))
            .headers(headers -> headers
                .frameOptions(frameOptions -> frameOptions.deny())
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000)
                )
                .contentTypeOptions(Customizer.withDefaults())
                .referrerPolicy(referrer -> referrer
                    .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
                )
                .contentSecurityPolicy(csp -> csp.policyDirectives(CSP_POLICY))
                .permissionsPolicy(permissions -> permissions.policy(PERMISSIONS_POLICY))
            );
        return http.build();
    }

    // Everything else: JWT-protected
    @Bean
    @org.springframework.core.annotation.Order(2)
    public SecurityFilterChain apiFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/version", "/api/auth/config").permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .headers(headers -> headers
                .frameOptions(frameOptions -> frameOptions.deny())
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000)
                )
                .contentTypeOptions(Customizer.withDefaults())
                .referrerPolicy(referrer -> referrer
                    .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
                )
                .contentSecurityPolicy(csp -> csp.policyDirectives(CSP_POLICY))
                .permissionsPolicy(permissions -> permissions.policy(PERMISSIONS_POLICY))
            );
        
        return http.build();
    }

    @Bean
    public com.ascension.security.UserRevocationJwtValidator userRevocationJwtValidator(com.ascension.service.UserService userService) {
        return new com.ascension.security.UserRevocationJwtValidator(userService);
    }

    @Bean
    public JwtDecoder jwtDecoder(com.ascension.security.UserRevocationJwtValidator userRevocationJwtValidator) {
        SecretKey key = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key).build();
        org.springframework.security.oauth2.core.OAuth2TokenValidator<org.springframework.security.oauth2.jwt.Jwt> withIssuer = 
            org.springframework.security.oauth2.jwt.JwtValidators.createDefaultWithIssuer("ascension-backend");
        decoder.setJwtValidator(new org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator<>(withIssuer, userRevocationJwtValidator));
        return decoder;
    }

    @Bean
    public JwtEncoder jwtEncoder() {
        SecretKey key = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        JWKSource<SecurityContext> immutableSecret = new ImmutableSecret<>(key);
        return new NimbusJwtEncoder(immutableSecret);
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration configuration = new org.springframework.web.cors.CorsConfiguration();
        java.util.List<String> origins = java.util.Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        
        if (origins.size() == 1 && "*".equals(origins.get(0))) {
            configuration.addAllowedOriginPattern("*");
        } else {
            configuration.setAllowedOrigins(origins);
            configuration.setAllowCredentials(true);
        }
        
        configuration.setAllowedMethods(java.util.Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(java.util.Arrays.asList("*"));
        configuration.setExposedHeaders(java.util.Arrays.asList("Content-Type", "X-AI-Model", "Content-Disposition"));
        
        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}

