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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@org.springframework.context.annotation.Import(com.ascension.TestcontainersConfiguration.class)

class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RefreshTokenService refreshTokenService;

    @Test
    void refresh_WhenTokenMissing_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/auth/refresh").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_WhenTokenNotInDatabase_ReturnsUnauthorized() throws Exception {
        when(refreshTokenService.findByToken(anyString())).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/refresh")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                .cookie(new jakarta.servlet.http.Cookie("refreshToken", "invalid_token")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void refresh_WhenTokenReusedWithinGracePeriod_ReturnsOkWithoutCookie() throws Exception {
        RefreshToken token = new RefreshToken();
        token.setEmail("test@test.com");
        token.setExpiryDate(java.time.Instant.now().plusSeconds(3600));
        // Simulate a token replaced 5 seconds ago (within 15s grace period)
        token.setReplacedAt(java.time.Instant.now().minusSeconds(5));

        when(refreshTokenService.findByToken(anyString())).thenReturn(Optional.of(token));

        mockMvc.perform(post("/api/auth/refresh")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                .cookie(new jakarta.servlet.http.Cookie("refreshToken", "reused_token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie().doesNotExist("refreshToken"));
    }

    @Test
    void refresh_WhenTokenReusedAfterGracePeriod_ReturnsUnauthorized() throws Exception {
        RefreshToken token = new RefreshToken();
        token.setEmail("test@test.com");
        token.setExpiryDate(java.time.Instant.now().plusSeconds(3600));
        // Simulate a token replaced 20 seconds ago (outside 15s grace period)
        token.setReplacedAt(java.time.Instant.now().minusSeconds(20));

        when(refreshTokenService.findByToken(anyString())).thenReturn(Optional.of(token));

        mockMvc.perform(post("/api/auth/refresh")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                .cookie(new jakarta.servlet.http.Cookie("refreshToken", "reused_token")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }
}

