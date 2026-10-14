package com.ascension.interceptor;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitInterceptorTest {

    private static final String AI_PATH = "/api/nutrition/ai/assistant-summary";

    private final RateLimitInterceptor interceptor = new RateLimitInterceptor();

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private int hit(String path, String ip) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
        request.setRequestURI(path);
        request.setRemoteAddr(ip);
        MockHttpServletResponse response = new MockHttpServletResponse();
        boolean allowed = interceptor.preHandle(request, response, new Object());
        return allowed ? 200 : response.getStatus();
    }

    private void loginAs(String name) {
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken(name, "n/a", "ROLE_USER"));
    }

    @Test
    void nutritionAiEndpointsAreRateLimited() throws Exception {
        for (int i = 0; i < RateLimitInterceptor.MAX_REQUESTS_PER_MINUTE; i++) {
            assertThat(hit(AI_PATH, "10.0.0.1")).isEqualTo(200);
        }
        assertThat(hit(AI_PATH, "10.0.0.1")).isEqualTo(429);
    }

    @Test
    void differentAiPathsShareTheSameQuota() throws Exception {
        for (int i = 0; i < RateLimitInterceptor.MAX_REQUESTS_PER_MINUTE; i++) {
            hit("/api/nutrition/ai/ocr", "10.0.0.2");
        }
        assertThat(hit("/api/nutrition/ai/assistant-chat", "10.0.0.2")).isEqualTo(429);
    }

    @Test
    void authenticatedUsersAreLimitedPerUserNotPerIp() throws Exception {
        loginAs("alice@example.com");
        for (int i = 0; i < RateLimitInterceptor.MAX_REQUESTS_PER_MINUTE; i++) {
            hit(AI_PATH, "10.0.0.3");
        }
        assertThat(hit(AI_PATH, "10.0.0.3")).isEqualTo(429);

        // Otro usuario desde la misma IP conserva su propia cuota.
        loginAs("bob@example.com");
        assertThat(hit(AI_PATH, "10.0.0.3")).isEqualTo(200);
    }

    @Test
    void authEndpointsAreLimitedPerIp() throws Exception {
        for (int i = 0; i < RateLimitInterceptor.MAX_REQUESTS_PER_MINUTE; i++) {
            hit("/api/auth/login", "10.0.0.4");
        }
        assertThat(hit("/api/auth/login", "10.0.0.4")).isEqualTo(429);
        assertThat(hit("/api/auth/login", "10.0.0.5")).isEqualTo(200);
    }

    @Test
    void userExportEndpointsAreRateLimited() throws Exception {
        loginAs("charlie@example.com");
        for (int i = 0; i < RateLimitInterceptor.USER_MAX_REQUESTS_PER_MINUTE; i++) {
            assertThat(hit("/api/user/export", "10.0.0.7")).isEqualTo(200);
        }
        assertThat(hit("/api/user/export", "10.0.0.7")).isEqualTo(429);
    }

    @Test
    void unrelatedEndpointsAreNeverLimited() throws Exception {
        for (int i = 0; i < 100; i++) {
            assertThat(hit("/api/nutrition/logs", "10.0.0.6")).isEqualTo(200);
        }
    }

    @Test
    void tooManyRequestsResponse_returnsJsonWithUtf8ContentType() throws Exception {
        for (int i = 0; i < RateLimitInterceptor.MAX_REQUESTS_PER_MINUTE; i++) {
            hit(AI_PATH, "10.0.0.99");
        }
        MockHttpServletRequest request = new MockHttpServletRequest("POST", AI_PATH);
        request.setRequestURI(AI_PATH);
        request.setRemoteAddr("10.0.0.99");
        MockHttpServletResponse response = new MockHttpServletResponse();
        boolean allowed = interceptor.preHandle(request, response, new Object());

        assertThat(allowed).isFalse();
        assertThat(response.getStatus()).isEqualTo(429);
        assertThat(response.getContentType()).isEqualTo("application/json;charset=UTF-8");
        assertThat(response.getContentAsString()).contains("Demasiadas peticiones. Por favor, inténtalo de nuevo en unos minutos.");
    }

    @Test
    void unregisteredApiAiPrefix_isNotRateLimited() throws Exception {
        assertThat(RateLimitInterceptor.groupOf("/api/ai")).isNull();
        assertThat(RateLimitInterceptor.groupOf("/api/ai/chat")).isNull();
        for (int i = 0; i < 50; i++) {
            assertThat(hit("/api/ai/chat", "10.0.0.88")).isEqualTo(200);
        }
    }
}
