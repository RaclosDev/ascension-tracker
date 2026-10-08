package com.ascension.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final Map<String, Deque<Long>> requestCounts = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 20;
    private static final long TIME_WINDOW_MS = 60000;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String clientIp = request.getRemoteAddr();
        String path = request.getRequestURI();

        // Limitar endpoints sensibles
        if (path.startsWith("/api/auth") || path.startsWith("/api/ai") || path.startsWith("/api/food-external")) {
            String key = clientIp + ":" + path;
            long currentTime = System.currentTimeMillis();

            requestCounts.putIfAbsent(key, new ConcurrentLinkedDeque<>());
            Deque<Long> timestamps = requestCounts.get(key);

            // Limpiar timestamps viejos
            while (!timestamps.isEmpty() && currentTime - timestamps.peekFirst() > TIME_WINDOW_MS) {
                timestamps.pollFirst();
            }

            if (timestamps.size() >= MAX_REQUESTS_PER_MINUTE) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.getWriter().write("Too many requests. Please try again later.");
                return false;
            }

            timestamps.addLast(currentTime);
        }

        return true;
    }
}
