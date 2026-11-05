package com.ascension.interceptor;

import com.ascension.dto.ConsentDtos.Kind;
import com.ascension.service.ConsentService;
import com.ascension.util.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Health data (weight, photos, food diary, check-ins) is only written with the user's explicit
 * consent, and nothing goes to the AI without its own consent (GDPR art. 9.2.a). Reads and
 * deletions stay open, so a user who withdraws can still see and remove what was stored.
 */
@Component
public class ConsentInterceptor implements HandlerInterceptor {

    private static final Pattern CHECKIN = Pattern.compile("/api/coaching/coaches/[^/]+/checkin");

    private final ConsentService consentService;
    private final boolean enforce;

    public ConsentInterceptor(ConsentService consentService,
                              @Value("${app.consent.enforce:true}") boolean enforce) {
        this.consentService = consentService;
        this.enforce = enforce;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (!enforce || !isWrite(request.getMethod())) {
            return true;
        }
        List<Kind> needed = required(request.getRequestURI());
        if (needed.isEmpty()) {
            return true;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth != null && auth.getPrincipal() instanceof Jwt jwt ? SecurityUtils.extractEmail(jwt) : null;
        if (email == null) {
            return true; // Security has already refused anonymous calls to these paths.
        }
        for (Kind kind : needed) {
            if (!consentService.isGranted(email, kind)) {
                return reject(response, kind);
            }
        }
        return true;
    }

    static List<Kind> required(String path) {
        if (path.startsWith("/api/nutrition/ai/")) {
            return List.of(Kind.HEALTH_DATA, Kind.AI_HEALTH);
        }
        if (under(path, "/api/weights") || under(path, "/api/progress-photos") || under(path, "/api/nutrition/logs")
                || path.equals("/api/user/restore") || CHECKIN.matcher(path).matches()) {
            return List.of(Kind.HEALTH_DATA);
        }
        return List.of();
    }

    private static boolean under(String path, String root) {
        return path.equals(root) || path.startsWith(root + "/");
    }

    private static boolean isWrite(String method) {
        return "POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || "PATCH".equalsIgnoreCase(method);
    }

    private static boolean reject(HttpServletResponse response, Kind kind) throws Exception {
        String message = kind == Kind.AI_HEALTH
                ? "Para usar la IA con tus comidas, activa ese permiso en Ajustes > Privacidad."
                : "Para guardar datos de salud, da tu consentimiento en Ajustes > Privacidad.";
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"error\":\"" + message + "\",\"code\":\"CONSENT_REQUIRED\",\"consent\":\""
                + kind.name() + "\"}");
        return false;
    }
}
