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

    private final Cache<String, Bucket> requestBuckets = Caffeine.newBuilder()
            .maximumSize(50_000)
            .expireAfterAccess(1, TimeUnit.MINUTES)
            .build();

    private Bucket createNewBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(MAX_REQUESTS_PER_MINUTE)
                .refillGreedy(MAX_REQUESTS_PER_MINUTE, Duration.ofMinutes(1))
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
        Bucket bucket = requestBuckets.get(key, k -> createNewBucket());

        if (!bucket.tryConsume(1)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", "60");
            response.getWriter().write("Too many requests. Please try again later.");
            return false;
        }
        return true;
    }

    static String groupOf(String path) {
        if (path.startsWith("/api/auth")) {
            return "auth";
        }
        if (path.startsWith("/api/nutrition/ai") || path.startsWith("/api/ai")) {
            return "ai";
        }
        if (path.startsWith("/api/food-external")) {
            return "food-external";
        }
        if (path.startsWith("/api/push")) {
            return "push";
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
