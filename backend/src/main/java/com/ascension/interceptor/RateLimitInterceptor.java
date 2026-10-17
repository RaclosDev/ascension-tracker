package com.ascension.interceptor;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    static final int MAX_REQUESTS_PER_MINUTE = 20;
    static final int USER_MAX_REQUESTS_PER_MINUTE = 10;

    private final Cache<String, Bucket> requestBuckets = Caffeine.newBuilder()
            .maximumSize(50_000)
            .expireAfterAccess(1, TimeUnit.MINUTES)
            .build();

    private Bucket createNewBucket(String group) {
        int capacity = "user".equals(group) ? USER_MAX_REQUESTS_PER_MINUTE : MAX_REQUESTS_PER_MINUTE;
        Bandwidth limit = Bandwidth.builder()
                .capacity(capacity)
                .refillGreedy(capacity, Duration.ofMinutes(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String group = groupOf(request.getRequestURI());
        if (group == null) {
            return true;
        }

        String key = group + ":" + clientId(group, request);
        Bucket bucket = requestBuckets.get(key, k -> createNewBucket(group));

        if (!bucket.tryConsume(1)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", "60");
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\":\"Demasiadas peticiones. Por favor, inténtalo de nuevo en unos minutos.\"}");
            return false;
        }
        return true;
    }

    static String groupOf(String path) {
        if (path.startsWith("/api/auth")) {
            return "auth";
        }
        if (path.startsWith("/api/nutrition/ai")) {
            return "ai";
        }
        if (path.startsWith("/api/food-external")) {
            return "food-external";
        }
        if (path.startsWith("/api/push")) {
            return "push";
        }
        if (path.startsWith("/api/user")) {
            return "user";
        }
        return null;
    }

    private static String clientId(String group, HttpServletRequest request) {
        if (!"auth".equals(group)) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
                return "user:" + auth.getName();
            }
        }
        return "ip:" + request.getRemoteAddr();
    }
}
