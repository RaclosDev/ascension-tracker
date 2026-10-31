package com.ascension.filter;

import com.ascension.model.RefreshToken;
import com.ascension.service.IdempotencyService;
import com.ascension.util.SecurityUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

@Component
public class IdempotencyFilter extends OncePerRequestFilter {
    private static final Set<String> PATHS = Set.of("/api/workouts", "/api/workouts/templates",
            "/api/nutrition/logs", "/api/nutrition/ai/assistant-apply", "/api/user/restore",
            "/api/nutrition/meals", "/api/nutrition/recipes", "/api/nutrition/my-foods");
    private final org.springframework.beans.factory.ObjectProvider<IdempotencyService> service;
    private final org.springframework.beans.factory.ObjectProvider<com.ascension.interceptor.RateLimitInterceptor> rateLimit;
    public IdempotencyFilter(org.springframework.beans.factory.ObjectProvider<IdempotencyService> service,
            org.springframework.beans.factory.ObjectProvider<com.ascension.interceptor.RateLimitInterceptor> rateLimit) {
        this.service = service;
        this.rateLimit = rateLimit;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String key = request.getHeader("Idempotency-Key");
        var auth = SecurityContextHolder.getContext().getAuthentication();
        boolean supported = PATHS.contains(request.getRequestURI())
                || request.getRequestURI().matches("/api/workouts/exercises/[^/]+/merge");
        if (key == null || !"POST".equals(request.getMethod()) || !supported
                || auth == null || !(auth.getPrincipal() instanceof Jwt jwt)) {
            chain.doFilter(request, response);
            return;
        }
        if (!key.matches("[A-Za-z0-9:_-]{1,128}")) {
            response.sendError(400, "Invalid Idempotency-Key");
            return;
        }
        // Consume the HTTP quota before opening the business transaction (even failed writes count).
        var limiter = rateLimit.getIfAvailable();
        if (limiter != null) {
            try {
                if (!limiter.preHandle(request, response, this)) return;
                request.setAttribute(com.ascension.interceptor.RateLimitInterceptor.CHECKED_ATTRIBUTE, true);
            } catch (Exception e) { throw new ServletException(e); }
        }
        byte[] body = request.getInputStream().readNBytes(5 * 1024 * 1024 + 1);
        if (body.length > 5 * 1024 * 1024) { response.sendError(413); return; }
        String hash = RefreshToken.hashToken(request.getRequestURI() + "?" + request.getQueryString()
                + "\n" + new String(body, StandardCharsets.UTF_8));
        var buffered = new ContentCachingResponseWrapper(response);
        try {
            var result = service.getObject().execute(SecurityUtils.extractEmail(jwt), key, hash, () -> {
                try {
                    chain.doFilter(withBody(request, body), buffered);
                    return new IdempotencyService.Result(buffered.getStatus(), buffered.getContentType(), buffered.getContentAsByteArray());
                } catch (IOException e) {
                    throw new UncheckedIOException(e);
                } catch (ServletException e) {
                    throw new IllegalStateException(e);
                }
            });
            response.setStatus(result.status());
            if (result.contentType() != null) response.setContentType(result.contentType());
            response.setContentLength(result.body().length);
            response.getOutputStream().write(result.body());
        } catch (UncheckedIOException e) {
            throw e.getCause();
        }
    }

    private static HttpServletRequest withBody(HttpServletRequest request, byte[] bytes) {
        return new HttpServletRequestWrapper(request) {
            @Override public ServletInputStream getInputStream() {
                var input = new ByteArrayInputStream(bytes);
                return new ServletInputStream() {
                    @Override public int read() { return input.read(); }
                    @Override public boolean isFinished() { return input.available() == 0; }
                    @Override public boolean isReady() { return true; }
                    @Override public void setReadListener(ReadListener listener) {
                        throw new IllegalStateException("Only synchronous JSON endpoints support idempotency");
                    }
                };
            }
        };
    }
}
