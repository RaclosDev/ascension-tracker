package com.ascension.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ascension.service.IdempotencyService;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

class IdempotencyFilterTest {
    @SuppressWarnings("unchecked")
    private final ObjectProvider<IdempotencyService> serviceProvider = mock(ObjectProvider.class);
    @SuppressWarnings("unchecked")
    private final ObjectProvider<com.ascension.interceptor.RateLimitInterceptor> limiterProvider = mock(ObjectProvider.class);
    private final IdempotencyService service = mock(IdempotencyService.class);
    private final IdempotencyFilter filter = new IdempotencyFilter(serviceProvider, limiterProvider);

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    private void authenticate() {
        Jwt jwt = Jwt.withTokenValue("t").header("alg", "none").subject("a@test.dev").claim("email", "a@test.dev").build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
        when(serviceProvider.getObject()).thenReturn(service);
        when(service.execute(any(), any(), any(), any()))
                .thenReturn(new IdempotencyService.Result(200, "application/json", "{}".getBytes(StandardCharsets.UTF_8)));
    }

    private MockHttpServletRequest post(String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", uri);
        request.setContent("{}".getBytes(StandardCharsets.UTF_8));
        request.addHeader("Idempotency-Key", "intent-1");
        return request;
    }

    @ParameterizedTest
    @ValueSource(strings = {"/api/nutrition/ai/log", "/api/nutrition/ai/food", "/api/workouts/import"})
    void writesThatSpendQuotaOrCreateRowsAreIdempotent(String uri) throws Exception {
        authenticate();
        filter.doFilter(post(uri), new MockHttpServletResponse(), new MockFilterChain());
        verify(service).execute(eq("a@test.dev"), eq("intent-1"), any(), any());
    }

    @Test
    void unlistedPathsAreNotIntercepted() throws Exception {
        authenticate();
        filter.doFilter(post("/api/nutrition/ai/assistant-chat"), new MockHttpServletResponse(), new MockFilterChain());
        verify(service, never()).execute(any(), any(), any(), any());
    }
}
