package com.ascension.interceptor;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate limit en memoria (ventana fija de 1 minuto) para los endpoints sensibles.
 *
 * - /api/auth/**              -> por IP
 * - /api/nutrition/ai/**      -> por usuario autenticado (o IP si no hay sesion)
 * - /api/food-external/**     -> por usuario autenticado (o IP si no hay sesion)
 *
 * Los contadores viven en una cache Caffeine acotada para que un atacante no pueda
 * hacer crecer la memoria inventando claves.
 */
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    static final int MAX_REQUESTS_PER_MINUTE = 20;

    private final Cache<String, AtomicInteger> requestCounts = Caffeine.newBuilder()
            .maximumSize(50_000)
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .build();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String group = groupOf(request.getRequestURI());
        if (group == null) {
            return true;
        }

        String key = group + ":" + clientId(group, request);
        AtomicInteger count = requestCounts.get(key, k -> new AtomicInteger(0));

        if (count.incrementAndGet() > MAX_REQUESTS_PER_MINUTE) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", "60");
            response.getWriter().write("Too many requests. Please try again later.");
            return false;
        }
        return true;
    }

    /** Devuelve el grupo de limite al que pertenece la ruta, o null si no se limita. */
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
