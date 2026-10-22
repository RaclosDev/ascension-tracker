package com.ascension.controller;

import com.ascension.config.SecurityConfig;
import com.ascension.exception.TokenRefreshException;
import com.ascension.interceptor.RateLimitInterceptor;
import com.ascension.model.RefreshToken;
import com.ascension.service.AccountDeletionService;
import com.ascension.service.RefreshTokenService;
import com.ascension.service.UserService;
import com.ascension.service.UserService.User;
import com.ascension.service.UserService.UserSecurityState;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = {
    "app.jwt.secret=this_is_a_very_long_secret_that_is_at_least_32_bytes_long_for_tests",
    "google.client-id=test-google-client-id"
})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtEncoder jwtEncoder;

    @Autowired
    private AuthController authController;

    @MockBean
    private RefreshTokenService refreshTokenService;

    @MockBean
    private UserService userService;

    @MockBean
    private AccountDeletionService accountDeletionService;

    @MockBean
    private GoogleIdTokenVerifier googleIdTokenVerifier;

    @MockBean
    private RateLimitInterceptor rateLimitInterceptor;

    @BeforeEach
    void setUpRateLimit() throws Exception {
        when(rateLimitInterceptor.preHandle(
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        )).thenReturn(true);
    }

    @Test
    void refresh_WhenTokenMissing_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/auth/refresh").with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_WhenTokenNotInDatabase_ReturnsUnauthorized() throws Exception {
        when(refreshTokenService.rotateRefreshToken(anyString()))
                .thenThrow(new TokenRefreshException("Refresh token not found"));

        mockMvc.perform(post("/api/auth/refresh")
                .with(csrf())
                .cookie(new jakarta.servlet.http.Cookie("refreshToken", "invalid_token")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists())
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));
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
        rt.setPlainToken("plain-refresh-token");
        when(refreshTokenService.createRefreshToken(anyString())).thenReturn(rt);

        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"valid-google-token\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(cookie().exists("refreshToken"));
    }

    @Test
    void refresh_WhenTokenReusedWithinGracePeriod_ReturnsOkWithNewCookieAndNoRefreshTokenInBody() throws Exception {
        RefreshToken graceToken = new RefreshToken();
        graceToken.setEmail("test@test.com");
        graceToken.setPlainToken("valid_new_grace_token");

        when(refreshTokenService.rotateRefreshToken(anyString())).thenReturn(graceToken);

        mockMvc.perform(post("/api/auth/refresh")
                .with(csrf())
                .cookie(new jakarta.servlet.http.Cookie("refreshToken", "reused_token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(cookie().exists("refreshToken"));
    }

    @Test
    void refresh_WhenTokenProvidedViaHeader_IsIgnoredAndReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .with(csrf())
                .header("X-Refresh-Token", "header_token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Refresh token is missing"));
    }

    @Test
    void refresh_WhenTokenProvidedViaBody_IsIgnoredAndReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .with(csrf())
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
                .thenThrow(new TokenRefreshException("Session expired. Please log in again."));

        mockMvc.perform(post("/api/auth/refresh")
                .with(csrf())
                .cookie(new jakarta.servlet.http.Cookie("refreshToken", "reused_token")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists())
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));
    }

    @Test
    void securityHeaders_areProperlyConfigured() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .secure(true)
                .with(csrf()))
                .andExpect(header().string("Strict-Transport-Security", containsString("max-age=31536000")))
                .andExpect(header().string("Strict-Transport-Security", containsString("includeSubDomains")))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Referrer-Policy", "strict-origin-when-cross-origin"))
                .andExpect(header().string("X-Frame-Options", "DENY"));
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
                new User("recycled@example.com", "Original Name", null, "original-sub", null)
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
                new User("victim@example.com", "Victim Name", null, "victim-sub", null)
        ));

        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"token-sub-stolen\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void logout_WhenCookieProvided_DeletesCurrentTokenAndFamilyWithoutRevokingOtherDevices() throws Exception {
        RefreshToken rt = new RefreshToken();
        rt.setEmail("user@example.com");
        rt.setFamilyId("device-family-123");
        when(refreshTokenService.findByToken(anyString())).thenReturn(Optional.of(rt));

        mockMvc.perform(post("/api/auth/logout")
                .with(csrf())
                .cookie(new jakarta.servlet.http.Cookie("refreshToken", "my_refresh_cookie")))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));

        verify(userService, org.mockito.Mockito.never()).updateTokensValidAfter(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any());
        verify(refreshTokenService).delete(rt);
        verify(refreshTokenService).deleteByFamilyId("device-family-123");
    }

    @Test
    void logout_WhenAllDevicesTrue_UpdatesTokensValidAfterAndDeletesAllTokens() throws Exception {
        RefreshToken rt = new RefreshToken();
        rt.setEmail("user@example.com");
        when(refreshTokenService.findByToken(anyString())).thenReturn(Optional.of(rt));

        mockMvc.perform(post("/api/auth/logout")
                .param("allDevices", "true")
                .with(csrf())
                .cookie(new jakarta.servlet.http.Cookie("refreshToken", "my_refresh_cookie")))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));

        verify(userService).updateTokensValidAfter(org.mockito.ArgumentMatchers.eq("user@example.com"), org.mockito.ArgumentMatchers.any());
        verify(refreshTokenService).deleteByEmail("user@example.com");
    }

    @Test
    void login_DoesNotRevokeExistingDevicesTokensValidAfter() throws Exception {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken idToken = org.mockito.Mockito.mock(com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.class);
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload = new com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload();
        payload.setEmailVerified(true);
        payload.setEmail("multidevice@example.com");
        payload.setSubject("google-sub-456");
        payload.set("name", "Multi User");
        when(idToken.getPayload()).thenReturn(payload);
        when(googleIdTokenVerifier.verify("token-multidevice")).thenReturn(idToken);

        when(userService.findByEmail("multidevice@example.com")).thenReturn(Optional.empty());
        when(userService.findByGoogleSub("google-sub-456")).thenReturn(Optional.empty());
        RefreshToken mockRt = new RefreshToken("multidevice@example.com", java.time.Instant.now().plusSeconds(3600), "fam-456");
        when(refreshTokenService.createRefreshToken("multidevice@example.com")).thenReturn(mockRt);

        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"token-multidevice\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());

        verify(userService, org.mockito.Mockito.never()).updateTokensValidAfter(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void deleteAccount_unauthenticated_returnsUnauthorized() throws Exception {
        mockMvc.perform(delete("/api/auth/account").with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    private String createSignedJwt(String email, java.time.Instant issuedAt) {
        java.time.Instant expiresAt = issuedAt.plusSeconds(900);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("ascension-backend")
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .subject(email)
                .claim("email", email)
                .build();
        MacAlgorithm alg = MacAlgorithm.HS256;
        JwsHeader jwsHeader = JwsHeader.with(alg).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).getTokenValue();
    }

    @Test
    void requestWithToken_whenTokenIssuedBeforeLogout_isRejectedWith401() throws Exception {
        java.time.Instant tokenIssuedAt = java.time.Instant.now().minusSeconds(30);
        java.time.Instant logoutTime = java.time.Instant.now().minusSeconds(5);
        String token = createSignedJwt("user@example.com", tokenIssuedAt);

        when(userService.getUserSecurityState("user@example.com"))
                .thenReturn(new UserSecurityState(true, logoutTime));

        mockMvc.perform(delete("/api/auth/account")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void requestWithToken_whenAccountDeleted_isRejectedWith401() throws Exception {
        String token = createSignedJwt("deleted@example.com", java.time.Instant.now().minusSeconds(10));

        when(userService.getUserSecurityState("deleted@example.com"))
                .thenReturn(new UserSecurityState(false, null));

        mockMvc.perform(delete("/api/auth/account")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void requestWithToken_whenTokenIssuedAfterTokensValidAfter_isAccepted() throws Exception {
        java.time.Instant validAfter = java.time.Instant.now().minusSeconds(60);
        java.time.Instant tokenIssuedAt = java.time.Instant.now().minusSeconds(10);
        String token = createSignedJwt("active@example.com", tokenIssuedAt);

        when(userService.getUserSecurityState("active@example.com"))
                .thenReturn(new UserSecurityState(true, validAfter));

        mockMvc.perform(delete("/api/auth/account")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    void refresh_WhenOriginValid_AllowsRequest() throws Exception {
        RefreshToken validToken = new RefreshToken();
        validToken.setEmail("test@test.com");
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

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Origin", "https://malicious.evil.com");
        ResponseEntity<?> response = authController.refreshtoken("sample_token", request);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals(java.util.Map.of("error", "Forbidden origin"), response.getBody());
    }

    @Test
    void refresh_WhenOriginAbsent_AllowsRequest() throws Exception {
        RefreshToken validToken = new RefreshToken();
        validToken.setEmail("test@test.com");
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

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Origin", "https://malicious.evil.com");
        ResponseEntity<?> response = authController.logout("sample_token", null, null, request);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals(java.util.Map.of("error", "Forbidden origin"), response.getBody());
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
        payload.setSubject("athlete-sub");
        payload.set("name", "Athlete Test");
        payload.set("picture", "https://example.com/pic.png");
        when(idToken.getPayload()).thenReturn(payload);
        when(googleIdTokenVerifier.verify("valid-google-token-lax")).thenReturn(idToken);

        RefreshToken rt = new RefreshToken();
        rt.setEmail("athlete@example.com");
        rt.setPlainToken("plain-token-lax");
        when(refreshTokenService.createRefreshToken("athlete@example.com")).thenReturn(rt);

        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"valid-google-token-lax\"}"))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("SameSite=Lax")));
    }

    @Test
    void cookieSameSite_usesNoneOnlyWhenConfiguredExplicitly() throws Exception {
        ReflectionTestUtils.setField(authController, "cookieSameSite", "None");
        try {
            mockMvc.perform(post("/api/auth/logout")
                    .with(csrf()))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Set-Cookie", containsString("SameSite=None")));
        } finally {
            ReflectionTestUtils.setField(authController, "cookieSameSite", "Lax");
        }
    }

    @Test
    void login_whenVerifierThrowsGeneralSecurityException_returns401() throws Exception {
        when(googleIdTokenVerifier.verify("bad-sig-token"))
                .thenThrow(new java.security.GeneralSecurityException("Invalid signature"));

        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"bad-sig-token\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Failed to validate token"));
    }

    @Test
    void login_whenVerifierThrowsIllegalArgumentException_returns401() throws Exception {
        when(googleIdTokenVerifier.verify("malformed-token"))
                .thenThrow(new IllegalArgumentException("Malformed token format"));

        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"malformed-token\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Failed to validate token"));
    }

    @Test
    void login_whenUnexpectedExceptionOccurs_propagatesToGlobalHandlerAs500() throws Exception {
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken idToken = org.mockito.Mockito.mock(com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.class);
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload = new com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload();
        payload.setEmailVerified(true);
        payload.setEmail("dbfail@example.com");
        payload.setSubject("sub-db-fail");
        when(idToken.getPayload()).thenReturn(payload);
        when(googleIdTokenVerifier.verify("db-fail-token")).thenReturn(idToken);

        org.mockito.Mockito.doThrow(new DataAccessResourceFailureException("Database unreachable"))
                .when(userService).ensureUserExists(
                        org.mockito.ArgumentMatchers.anyString(),
                        org.mockito.ArgumentMatchers.any(),
                        org.mockito.ArgumentMatchers.any(),
                        org.mockito.ArgumentMatchers.anyString()
                );

        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"db-fail-token\"}"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void login_withPictureUrlLongerThan255Characters_succeedsAndPersistsUrl() throws Exception {
        String longPictureUrl = "https://lh3.googleusercontent.com/a/ACg8oc" + "A".repeat(250) + "=s96-c";
        org.assertj.core.api.Assertions.assertThat(longPictureUrl.length()).isGreaterThan(255);

        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken idToken = org.mockito.Mockito.mock(com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.class);
        com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload = new com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload();
        payload.setEmailVerified(true);
        payload.setEmail("longpic@example.com");
        payload.setSubject("sub-long-pic");
        payload.set("name", "Long Pic User");
        payload.set("picture", longPictureUrl);

        when(idToken.getPayload()).thenReturn(payload);
        when(googleIdTokenVerifier.verify("valid-long-pic-token")).thenReturn(idToken);

        RefreshToken rt = new RefreshToken();
        rt.setEmail("longpic@example.com");
        rt.setPlainToken("plain-token-long-pic");
        when(refreshTokenService.createRefreshToken("longpic@example.com")).thenReturn(rt);

        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\":\"valid-long-pic-token\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(cookie().exists("refreshToken"));

        verify(userService).ensureUserExists(
                org.mockito.ArgumentMatchers.eq("longpic@example.com"),
                org.mockito.ArgumentMatchers.eq("Long Pic User"),
                org.mockito.ArgumentMatchers.eq(longPictureUrl),
                org.mockito.ArgumentMatchers.eq("sub-long-pic")
        );
    }

    @Test
    void refresh_readsNameAndPictureFromUsersTable() throws Exception {
        RefreshToken rt = new RefreshToken();
        rt.setEmail("refreshed@example.com");
        rt.setPlainToken("plain-rotated-token");
        when(refreshTokenService.rotateRefreshToken("cookie-token")).thenReturn(rt);

        when(userService.findByEmail("refreshed@example.com")).thenReturn(Optional.of(
                new User(
                        "refreshed@example.com",
                        "Latest Name",
                        "https://example.com/latest-avatar.png",
                        "sub-123",
                        java.time.Instant.now()
                )
        ));

        mockMvc.perform(post("/api/auth/refresh")
                .with(csrf())
                .cookie(new jakarta.servlet.http.Cookie("refreshToken", "cookie-token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());

        verify(userService).findByEmail("refreshed@example.com");
    }
}

