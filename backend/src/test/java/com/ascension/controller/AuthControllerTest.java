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
    void refresh_WhenTokenReusedWithinGracePeriod_ReturnsOkWithNewCookie() throws Exception {
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
                .andExpect(jsonPath("$.refreshToken").value("valid_new_grace_token"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie().exists("refreshToken"));
    }

    @Test
    void refresh_WhenTokenProvidedViaHeader_ReturnsOk() throws Exception {
        RefreshToken graceToken = new RefreshToken();
        graceToken.setEmail("test@test.com");
        graceToken.setName("Test User");
        graceToken.setPicture("https://example.com/p.png");
        graceToken.setPlainToken("valid_new_grace_token");

        when(refreshTokenService.rotateRefreshToken("header_token")).thenReturn(graceToken);

        mockMvc.perform(post("/api/auth/refresh")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                .header("X-Refresh-Token", "header_token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.refreshToken").value("valid_new_grace_token"));
    }

    @Test
    void refresh_WhenTokenProvidedViaBody_ReturnsOk() throws Exception {
        RefreshToken graceToken = new RefreshToken();
        graceToken.setEmail("test@test.com");
        graceToken.setName("Test User");
        graceToken.setPicture("https://example.com/p.png");
        graceToken.setPlainToken("valid_new_grace_token");

        when(refreshTokenService.rotateRefreshToken("body_token")).thenReturn(graceToken);

        mockMvc.perform(post("/api/auth/refresh")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"body_token\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.refreshToken").value("valid_new_grace_token"));
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
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("X-Frame-Options", "SAMEORIGIN"));
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

        verify(accountDeletionService).wipeAccountData("athlete@example.com");
    }

    @Test
    void deleteAccount_withSubjectFallback_deletesAccountAndClearsCookie() throws Exception {
        mockMvc.perform(delete("/api/auth/account")
                .with(jwt().jwt(j -> j.subject("athlete-subject@example.com")))
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Account deleted successfully"))
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));

        verify(accountDeletionService).wipeAccountData("athlete-subject@example.com");
    }

    @Test
    void deleteAccount_unauthenticated_returnsUnauthorized() throws Exception {
        mockMvc.perform(delete("/api/auth/account").with(csrf()))
                .andExpect(status().isUnauthorized());
    }
}

