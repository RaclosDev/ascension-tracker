package com.ascension.interceptor;

import com.ascension.config.RateLimitProperties;
import com.ascension.service.ratelimit.InMemoryRateLimiterService;
import com.ascension.service.ratelimit.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    public static final int MAX_REQUESTS_PER_MINUTE = 20;
    public static final int USER_MAX_REQUESTS_PER_MINUTE = 10;

    private final RateLimiterService rateLimiterService;
    private final RateLimitProperties properties;

    public RateLimitInterceptor() {
        this(new InMemoryRateLimiterService(), new RateLimitProperties());
    }

    @Autowired
    public RateLimitInterceptor(
            @Autowired(required = false) RateLimiterService rateLimiterService,
            @Autowired(required = false) RateLimitProperties properties) {
        this.rateLimiterService = rateLimiterService != null ? rateLimiterService : new InMemoryRateLimiterService();
        this.properties = properties != null ? properties : new RateLimitProperties();
    }

    public RateLimiterService getRateLimiterService() {
        return rateLimiterService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();
        String method = request.getMethod();

        // 1. Specific endpoint bucket check (login, refresh, logout, import, restore, export, ai, food-external, push, user)
        String group = groupOf(path);
        if (group != null) {
            int capacity = capacityForGroup(group);
            String key = group + ":" + clientId(group, request);

            if (!rateLimiterService.tryConsume(key, capacity, Duration.ofMinutes(1))) {
                return rejectTooManyRequests(response);
            }
        }

        // 2. Generic per-user rate limit for mutating operations (writes: POST, PUT, DELETE, PATCH)
        if (isWriteMethod(method)) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
                String writeKey = "write:user:" + auth.getName();
                if (!rateLimiterService.tryConsume(writeKey, properties.getUserWriteLimit(), Duration.ofMinutes(1))) {
                    return rejectTooManyRequests(response);
                }
            }
        }

        return true;
    }

    private static boolean isWriteMethod(String method) {
        if (method == null) return false;
        String m = method.toUpperCase();
        return m.equals("POST") || m.equals("PUT") || m.equals("DELETE") || m.equals("PATCH");
    }

    private int capacityForGroup(String group) {
        return switch (group) {
            case "login" -> properties.getLoginLimit();
            case "refresh" -> properties.getRefreshLimit();
            case "logout" -> properties.getLogoutLimit();
            case "import" -> properties.getImportLimit();
            case "restore" -> properties.getRestoreLimit();
            case "export" -> properties.getExportLimit();
            case "ai" -> properties.getAiLimit();
            case "food-external" -> properties.getFoodExternalLimit();
            case "push" -> properties.getPushLimit();
            case "user" -> properties.getUserLimit();
            default -> MAX_REQUESTS_PER_MINUTE;
        };
    }

    public static String groupOf(String path) {
        if (path == null) {
            return null;
        }
        // Specific dedicated endpoint buckets
        if (path.equals("/api/auth/login") || path.startsWith("/api/auth/login/")) {
            return "login";
        }
        if (path.equals("/api/auth/refresh") || path.startsWith("/api/auth/refresh/")) {
            return "refresh";
        }
        if (path.equals("/api/auth/logout") || path.startsWith("/api/auth/logout/")) {
            return "logout";
        }
        if (path.equals("/api/workouts/import") || path.startsWith("/api/workouts/import/")) {
            return "import";
        }
        if (path.equals("/api/user/restore") || path.startsWith("/api/user/restore/")) {
            return "restore";
        }
        if (path.equals("/api/user/export") || path.startsWith("/api/user/export/")) {
            return "export";
        }

        // Domain-level groups
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
        // IP-keyed groups: login, refresh, auth
        if ("auth".equals(group) || "login".equals(group) || "refresh".equals(group)) {
            return "ip:" + request.getRemoteAddr();
        }

        // Authenticated user keyed (or fallback to IP if anonymous)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
            return "user:" + auth.getName();
        }
        return "ip:" + request.getRemoteAddr();
    }

    private static boolean rejectTooManyRequests(HttpServletResponse response) throws Exception {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setHeader("Retry-After", "60");
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"error\":\"Demasiadas peticiones. Por favor, inténtalo de nuevo en unos minutos.\"}");
        return false;
    }
}
