package com.ascension.config;

import com.ascension.controller.AuthController;
import com.ascension.controller.VersionController;
import com.ascension.service.AccountDeletionService;
import com.ascension.service.RefreshTokenService;
import com.ascension.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;

@WebMvcTest(controllers = {VersionController.class, AuthController.class})
@Import(SecurityConfig.class)
@TestPropertySource(properties = {
    "app.jwt.secret=this_is_a_very_long_secret_that_is_at_least_32_bytes_long_for_tests",
    "google.client-id=test-google-client-id"
})
class SecurityHeadersIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RefreshTokenService refreshTokenService;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private AccountDeletionService accountDeletionService;

    @MockitoBean
    private com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier googleIdTokenVerifier;

    @Test
    @DisplayName("Should include Content-Security-Policy and Permissions-Policy in apiFilterChain response")
    void apiFilterChain_shouldIncludeSecurityHeaders() throws Exception {
        mockMvc.perform(get("/api/version"))
                .andExpect(header().string("Content-Security-Policy", SecurityConfig.CSP_POLICY))
                .andExpect(header().string("Permissions-Policy", SecurityConfig.PERMISSIONS_POLICY));
    }

    @Test
    @DisplayName("Should include Content-Security-Policy and Permissions-Policy in authFilterChain response")
    void authFilterChain_shouldIncludeSecurityHeaders() throws Exception {
        mockMvc.perform(post("/api/auth/refresh").with(csrf()))
                .andExpect(header().string("Content-Security-Policy", SecurityConfig.CSP_POLICY))
                .andExpect(header().string("Permissions-Policy", SecurityConfig.PERMISSIONS_POLICY));
    }
}
