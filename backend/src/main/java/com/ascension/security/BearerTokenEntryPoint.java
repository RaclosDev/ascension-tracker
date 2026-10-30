package com.ascension.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.server.resource.BearerTokenError;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Answers unauthenticated requests with an RFC 6750 {@code WWW-Authenticate: Bearer} challenge.
 *
 * <p>Spring Security 7's {@code BearerTokenAuthenticationEntryPoint} always appends a
 * {@code resource_metadata} parameter (RFC 9728) pointing at an authorization-server discovery
 * document. This API issues its own HS256 tokens and has no authorization server, so the challenge
 * keeps the parameters Spring Security 6 sent: {@code error}, {@code error_description},
 * {@code error_uri} and {@code scope}.
 */
public final class BearerTokenEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) {
        HttpStatus status = HttpStatus.UNAUTHORIZED;
        Map<String, String> parameters = new LinkedHashMap<>();
        if (authException instanceof OAuth2AuthenticationException oauth2Exception) {
            OAuth2Error error = oauth2Exception.getError();
            parameters.put("error", error.getErrorCode());
            if (StringUtils.hasText(error.getDescription())) {
                parameters.put("error_description", error.getDescription());
            }
            if (StringUtils.hasText(error.getUri())) {
                parameters.put("error_uri", error.getUri());
            }
            if (error instanceof BearerTokenError bearerTokenError) {
                if (StringUtils.hasText(bearerTokenError.getScope())) {
                    parameters.put("scope", bearerTokenError.getScope());
                }
                status = bearerTokenError.getHttpStatus();
            }
        }
        response.addHeader(HttpHeaders.WWW_AUTHENTICATE, challenge(parameters));
        response.setStatus(status.value());
    }

    private static String challenge(Map<String, String> parameters) {
        if (parameters.isEmpty()) {
            return "Bearer";
        }
        return parameters.entrySet().stream()
                .map(entry -> entry.getKey() + "=\"" + entry.getValue() + "\"")
                .collect(Collectors.joining(", ", "Bearer ", ""));
    }
}
