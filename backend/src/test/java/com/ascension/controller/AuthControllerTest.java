package com.ascension.controller;

import com.ascension.model.RefreshToken;
import com.ascension.service.RefreshTokenService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.hamcrest.Matchers.containsString;

@org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest(AuthController.class)
@org.springframework.context.annotation.Import(com.ascension.config.SecurityConfig.class)
@org.springframework.test.context.TestPropertySource(properties = {
    "app.jwt.secret=this_is_a_very_long_secret_that_is_at_least_32_bytes_long_for_tests",
    "google.client-id=test-google-client-id"
})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
<<<<<<< HEAD
    private org.springframework.security.oauth2.jwt.JwtEncoder jwtEncoder;
=======
    private AuthController authController;
>>>>>>> c21cfd6 (fix(auth): enforce same-site lax default and origin validation on refresh and logout [audit #10])

    @MockBean
    private RefreshTokenService refreshTokenService;

    @MockBean
    private com.ascension.service.UserService userService;

    @MockBean
    private com.ascension.service.AccountDeletionService accountDeletionService;

    @MockBean
    private com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier googleIdTokenVerifier;

    @Test
    void refresh_WhenTokenMissing_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/auth/refresh").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_WhenTokenNotInDatabase_ReturnsUnauthorized() throws Exception {
        when(refreshTokenService.rotateRefreshToken(anyString()))
                .thenThrow(new com.ascension.exception.TokenRefreshException("Refresh token not found"));

        mockMvc.perform(post("/api/auth/refresh")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                .cookie(new jakarta.servlet.http.Cookie("refreshToken", "invalid_token")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Set-Cookie", org.hamcrest.Matchers.containsString("Max-Age=0")));
    }

    @Test
    void login_WhenSuccessful_ReturnsTokenAndSetsCookieWithoutRefreshTokenInBody() throws Exception {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken idToken = org.mockito.Mockito.mock(com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.class);
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload = new com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload();
        payload.setEmailVerified(true);
        payload.setEmail("athlete@example.com");
        payload.setSubject("google-sub-athlete-123");
        payload.set("name", "Athlete Test");
        payload.set("picture", "https://example.com/pic.png");
        when(idToken.getPayload()).thenReturn(payload);
        when(googleIdTokenVerifier.verify("valid-google-token")).thenReturn(idToken);

        RefreshToken rt = new RefreshToken();
        rt.setEmail("athlete@example.com");
        rt.setName("Athlete Test");
        rt.setPicture("https://example.com/pic.png");
        rt.setPlainToken("plain-refresh-token");
        when(refreshTokenService.createRefreshToken(anyString(), anyString(), anyString())).thenReturn(rt);

        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"valid-google-token\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie().exists("refreshToken"));
    }

    @Test
    void refresh_WhenTokenReusedWithinGracePeriod_ReturnsOkWithNewCookieAndNoRefreshTokenInBody() throws Exception {
        RefreshToken graceToken = new RefreshToken();
        graceToken.setEmail("test@test.com");
        graceToken.setName("Test User");
        graceToken.setPicture("https://example.com/p.png");
        graceToken.setPlainToken("valid_new_grace_token");

        when(refreshTokenService.rotateRefreshToken(anyString())).thenReturn(graceToken);

        mockMvc.perform(post("/api/auth/refresh")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                .cookie(new jakarta.servlet.http.Cookie("refreshToken", "reused_token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie().exists("refreshToken"));
    }

    @Test
    void refresh_WhenTokenProvidedViaHeader_IsIgnoredAndReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                .header("X-Refresh-Token", "header_token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Refresh token is missing"));
    }

    @Test
    void refresh_WhenTokenProvidedViaBody_IsIgnoredAndReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"body_token\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Refresh token is missing"));
    }

    @Test
    void logout_WhenNoCookieProvided_DoesNotCallDeleteEvenIfHeaderOrBodyPresent() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                .with(csrf())
                .header("X-Refresh-Token", "header_token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"body_token\"}"))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));

        org.mockito.Mockito.verifyNoInteractions(refreshTokenService);
    }

    @Test
    void refresh_WhenTokenReusedAfterGracePeriod_ReturnsUnauthorized() throws Exception {
        when(refreshTokenService.rotateRefreshToken(anyString()))
                .thenThrow(new com.ascension.exception.TokenRefreshException("Session expired. Please log in again."));

        mockMvc.perform(post("/api/auth/refresh")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                .cookie(new jakarta.servlet.http.Cookie("refreshToken", "reused_token")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Set-Cookie", org.hamcrest.Matchers.containsString("Max-Age=0")));
    }

    @Test
    void securityHeaders_areProperlyConfigured() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .secure(true)
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Strict-Transport-Security", org.hamcrest.Matchers.containsString("max-age=31536000")))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Strict-Transport-Security", org.hamcrest.Matchers.containsString("includeSubDomains")))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Referrer-Policy", "strict-origin-when-cross-origin"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("X-Frame-Options", "DENY"));
    }

    @Test
    void getConfig_isPubliclyAccessibleWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/auth/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.googleClientId").value("test-google-client-id"));
    }

    @Test
    void deleteAccount_withEmailClaim_deletesAccountAndClearsCookie() throws Exception {
        mockMvc.perform(delete("/api/auth/account")
                .with(jwt().jwt(j -> j.claim("email", "athlete@example.com").subject("ignored-subject")))
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Account deleted successfully"))
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));

        verify(userService).updateTokensValidAfter(org.mockito.ArgumentMatchers.eq("athlete@example.com"), org.mockito.ArgumentMatchers.any());
        verify(accountDeletionService).wipeAccountData("athlete@example.com");
        verify(userService).evictUser("athlete@example.com");
    }

    @Test
    void deleteAccount_withSubjectFallback_deletesAccountAndClearsCookie() throws Exception {
        mockMvc.perform(delete("/api/auth/account")
                .with(jwt().jwt(j -> j.subject("athlete-subject@example.com")))
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Account deleted successfully"))
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));

        verify(userService).updateTokensValidAfter(org.mockito.ArgumentMatchers.eq("athlete-subject@example.com"), org.mockito.ArgumentMatchers.any());
        verify(accountDeletionService).wipeAccountData("athlete-subject@example.com");
        verify(userService).evictUser("athlete-subject@example.com");
    }

    @Test
    void login_WhenRecycledEmailWithDifferentSub_ReturnsUnauthorized() throws Exception {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken idToken = org.mockito.Mockito.mock(com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.class);
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload = new com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload();
        payload.setEmailVerified(true);
        payload.setEmail("recycled@example.com");
        payload.setSubject("attacker-sub");
        when(idToken.getPayload()).thenReturn(payload);
        when(googleIdTokenVerifier.verify("token-recycled")).thenReturn(idToken);

        when(userService.findByEmail("recycled@example.com")).thenReturn(Optional.of(
                new com.ascension.service.UserService.User("recycled@example.com", "Original Name", null, "original-sub", null)
        ));

        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"token-recycled\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void login_WhenSubAlreadyBoundToDifferentEmail_ReturnsUnauthorized() throws Exception {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken idToken = org.mockito.Mockito.mock(com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.class);
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload = new com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload();
        payload.setEmailVerified(true);
        payload.setEmail("attacker@example.com");
        payload.setSubject("victim-sub");
        when(idToken.getPayload()).thenReturn(payload);
        when(googleIdTokenVerifier.verify("token-sub-stolen")).thenReturn(idToken);

        when(userService.findByEmail("attacker@example.com")).thenReturn(Optional.empty());
        when(userService.findByGoogleSub("victim-sub")).thenReturn(Optional.of(
                new com.ascension.service.UserService.User("victim@example.com", "Victim Name", null, "victim-sub", null)
        ));

        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"token-sub-stolen\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void logout_WhenCookieProvided_UpdatesTokensValidAfterAndDeletesToken() throws Exception {
        RefreshToken rt = new RefreshToken();
        rt.setEmail("user@example.com");
        when(refreshTokenService.findByToken(anyString())).thenReturn(Optional.of(rt));

        mockMvc.perform(post("/api/auth/logout")
                .with(csrf())
                .cookie(new jakarta.servlet.http.Cookie("refreshToken", "my_refresh_cookie")))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));

        verify(userService).updateTokensValidAfter(org.mockito.ArgumentMatchers.eq("user@example.com"), org.mockito.ArgumentMatchers.any());
        verify(refreshTokenService).delete(rt);
    }

    @Test
    void deleteAccount_unauthenticated_returnsUnauthorized() throws Exception {
        mockMvc.perform(delete("/api/auth/account").with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    private String createSignedJwt(String email, java.time.Instant issuedAt) {
        java.time.Instant expiresAt = issuedAt.plusSeconds(900);
        org.springframework.security.oauth2.jwt.JwtClaimsSet claims = org.springframework.security.oauth2.jwt.JwtClaimsSet.builder()
                .issuer("ascension-backend")
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .subject(email)
                .claim("email", email)
                .build();
        org.springframework.security.oauth2.jose.jws.MacAlgorithm alg = org.springframework.security.oauth2.jose.jws.MacAlgorithm.HS256;
        org.springframework.security.oauth2.jwt.JwsHeader jwsHeader = org.springframework.security.oauth2.jwt.JwsHeader.with(alg).build();
        return jwtEncoder.encode(org.springframework.security.oauth2.jwt.JwtEncoderParameters.from(jwsHeader, claims)).getTokenValue();
    }

    @Test
    void requestWithToken_whenTokenIssuedBeforeLogout_isRejectedWith401() throws Exception {
        java.time.Instant tokenIssuedAt = java.time.Instant.now().minusSeconds(30);
        java.time.Instant logoutTime = java.time.Instant.now().minusSeconds(5);
        String token = createSignedJwt("user@example.com", tokenIssuedAt);

        when(userService.getUserSecurityState("user@example.com"))
                .thenReturn(new com.ascension.service.UserService.UserSecurityState(true, logoutTime));

        mockMvc.perform(delete("/api/auth/account")
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void requestWithToken_whenAccountDeleted_isRejectedWith401() throws Exception {
        String token = createSignedJwt("deleted@example.com", java.time.Instant.now().minusSeconds(10));

        when(userService.getUserSecurityState("deleted@example.com"))
                .thenReturn(new com.ascension.service.UserService.UserSecurityState(false, null));

        mockMvc.perform(delete("/api/auth/account")
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void requestWithToken_whenTokenIssuedAfterTokensValidAfter_isAccepted() throws Exception {
        java.time.Instant validAfter = java.time.Instant.now().minusSeconds(60);
        java.time.Instant tokenIssuedAt = java.time.Instant.now().minusSeconds(10);
        String token = createSignedJwt("active@example.com", tokenIssuedAt);

        when(userService.getUserSecurityState("active@example.com"))
                .thenReturn(new com.ascension.service.UserService.UserSecurityState(true, validAfter));

        mockMvc.perform(delete("/api/auth/account")
                .header(org.springframework.http.HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    void refresh_WhenOriginValid_AllowsRequest() throws Exception {
        RefreshToken validToken = new RefreshToken();
        validToken.setEmail("test@test.com");
        validToken.setName("Test User");
        validToken.setPicture("https://example.com/p.png");
        validToken.setPlainToken("valid_plain_token");

        when(refreshTokenService.rotateRefreshToken(anyString())).thenReturn(validToken);

        mockMvc.perform(post("/api/auth/refresh")
                .with(csrf())
                .header("Origin", "http://localhost:5173")
                .cookie(new jakarta.servlet.http.Cookie("refreshToken", "sample_token")))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("SameSite=Lax")));
    }

    @Test
    void refresh_WhenOriginInvalid_ReturnsForbidden() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .with(csrf())
                .header("Origin", "https://malicious.evil.com")
                .cookie(new jakarta.servlet.http.Cookie("refreshToken", "sample_token")))
                .andExpect(status().isForbidden());

        org.springframework.mock.web.MockHttpServletRequest request = new org.springframework.mock.web.MockHttpServletRequest();
        request.addHeader("Origin", "https://malicious.evil.com");
        org.springframework.http.ResponseEntity<?> response = authController.refreshtoken("sample_token", request);
        org.junit.jupiter.api.Assertions.assertEquals(org.springframework.http.HttpStatus.FORBIDDEN, response.getStatusCode());
        org.junit.jupiter.api.Assertions.assertEquals(java.util.Map.of("error", "Forbidden origin"), response.getBody());
    }

    @Test
    void refresh_WhenOriginAbsent_AllowsRequest() throws Exception {
        RefreshToken validToken = new RefreshToken();
        validToken.setEmail("test@test.com");
        validToken.setName("Test User");
        validToken.setPicture("https://example.com/p.png");
        validToken.setPlainToken("valid_plain_token");

        when(refreshTokenService.rotateRefreshToken(anyString())).thenReturn(validToken);

        mockMvc.perform(post("/api/auth/refresh")
                .with(csrf())
                .cookie(new jakarta.servlet.http.Cookie("refreshToken", "sample_token")))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("SameSite=Lax")));
    }

    @Test
    void logout_WhenOriginValid_ReturnsOk() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                .with(csrf())
                .header("Origin", "https://ascension.raclos.es"))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("SameSite=Lax")));
    }

    @Test
    void logout_WhenOriginInvalid_ReturnsForbidden() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                .with(csrf())
                .header("Origin", "https://malicious.evil.com"))
                .andExpect(status().isForbidden());

        org.springframework.mock.web.MockHttpServletRequest request = new org.springframework.mock.web.MockHttpServletRequest();
        request.addHeader("Origin", "https://malicious.evil.com");
        org.springframework.http.ResponseEntity<?> response = authController.logout("sample_token", null, null, request);
        org.junit.jupiter.api.Assertions.assertEquals(org.springframework.http.HttpStatus.FORBIDDEN, response.getStatusCode());
        org.junit.jupiter.api.Assertions.assertEquals(java.util.Map.of("error", "Forbidden origin"), response.getBody());
    }

    @Test
    void logout_WhenOriginAbsent_ReturnsOk() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("SameSite=Lax")));
    }

    @Test
    void cookieSameSite_defaultsToLaxOnLogin() throws Exception {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken idToken = org.mockito.Mockito.mock(com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.class);
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload = new com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload();
        payload.setEmailVerified(true);
        payload.setEmail("athlete@example.com");
        payload.set("name", "Athlete Test");
        payload.set("picture", "https://example.com/pic.png");
        when(idToken.getPayload()).thenReturn(payload);
        when(googleIdTokenVerifier.verify("valid-google-token-lax")).thenReturn(idToken);

        RefreshToken rt = new RefreshToken();
        rt.setEmail("athlete@example.com");
        rt.setName("Athlete Test");
        rt.setPicture("https://example.com/pic.png");
        rt.setPlainToken("plain-token-lax");
        when(refreshTokenService.createRefreshToken(anyString(), anyString(), anyString())).thenReturn(rt);

        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"valid-google-token-lax\"}"))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("SameSite=Lax")));
    }

    @Test
    void cookieSameSite_usesNoneOnlyWhenConfiguredExplicitly() throws Exception {
        org.springframework.test.util.ReflectionTestUtils.setField(authController, "cookieSameSite", "None");
        try {
            mockMvc.perform(post("/api/auth/logout")
                    .with(csrf()))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Set-Cookie", containsString("SameSite=None")));
        } finally {
            org.springframework.test.util.ReflectionTestUtils.setField(authController, "cookieSameSite", "Lax");
        }
    }
}

