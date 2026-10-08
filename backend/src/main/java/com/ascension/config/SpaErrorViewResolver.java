package com.ascension.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.autoconfigure.web.servlet.error.ErrorViewResolver;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.ModelAndView;

import java.util.Collections;
import java.util.Map;

/**
 * Resolver de errores para Single Page Applications (SPA).
 * Si se produce un error 404 en una ruta que no es de la API ni un archivo estático con extensión,
 * reenvía a /index.html con código HTTP 200 para que React Router maneje la navegación en el cliente.
 */
@Component
public class SpaErrorViewResolver implements ErrorViewResolver {

    @Override
    public ModelAndView resolveErrorView(HttpServletRequest request, HttpStatus status, Map<String, Object> model) {
        if (status == HttpStatus.NOT_FOUND) {
            String path = (String) model.get("path");
            if (path == null) {
                path = request.getRequestURI();
            }
            if (path != null && !path.startsWith("/api") && !path.matches(".*\\.[a-zA-Z0-9]+$")) {
                return new ModelAndView("forward:/index.html", Collections.emptyMap(), HttpStatus.OK);
            }
        }
        return null;
    }
}
