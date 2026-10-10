package com.ascension.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.Instant;
import java.util.UUID;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String traceId = UUID.randomUUID().toString();
        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getDefaultMessage())
                .findFirst()
                .orElse("Datos invalidos");
        log.warn("Validation error: {} [trace_id: {}]", errorMessage, traceId);
        return buildErrorResponse(errorMessage, HttpStatus.BAD_REQUEST, traceId);
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ApiErrorResponse> handleSecurityException(SecurityException ex) {
        String traceId = UUID.randomUUID().toString();
        log.warn("Security exception: {} [trace_id: {}]", ex.getMessage(), traceId);
        return buildErrorResponse("Acceso denegado", HttpStatus.FORBIDDEN, traceId);
    }

    @ExceptionHandler(TokenRefreshException.class)
    public ResponseEntity<ApiErrorResponse> handleTokenRefreshException(TokenRefreshException ex) {
        String traceId = UUID.randomUUID().toString();
        log.warn("Refresh token error: {} [trace_id: {}]", ex.getMessage(), traceId);
        return buildErrorResponse("Error de autenticacion", HttpStatus.UNAUTHORIZED, traceId);
    }

    @ExceptionHandler(InvalidInputException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidInputException(InvalidInputException ex) {
        String traceId = UUID.randomUUID().toString();
        log.warn("Invalid input: {} [trace_id: {}]", ex.getMessage(), traceId);
        return buildErrorResponse("Entrada invalida", HttpStatus.BAD_REQUEST, traceId);
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex) {
        String traceId = UUID.randomUUID().toString();
        log.warn("Illegal argument: {} [trace_id: {}]", ex.getMessage(), traceId);
        return buildErrorResponse("Entrada invalida", HttpStatus.BAD_REQUEST, traceId);
    }

    @ExceptionHandler(AiProcessingException.class)
    public ResponseEntity<ApiErrorResponse> handleAiProcessingException(AiProcessingException ex) {
        String traceId = UUID.randomUUID().toString();
        log.error("AI processing error: {} [trace_id: {}]", ex.getMessage(), traceId);
        return buildErrorResponse(ex.getMessage(), HttpStatus.BAD_REQUEST, traceId);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleEntityNotFoundException(EntityNotFoundException ex) {
        String traceId = UUID.randomUUID().toString();
        log.warn("Entity not found: {} [trace_id: {}]", ex.getMessage(), traceId);
        return buildErrorResponse(ex.getMessage(), HttpStatus.NOT_FOUND, traceId);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGlobalException(Exception ex) {
        String traceId = UUID.randomUUID().toString();
        log.error("Unhandled exception occurred [trace_id: {}]", traceId, ex);
        return buildErrorResponse("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR, traceId);
    }

    private ResponseEntity<ApiErrorResponse> buildErrorResponse(String message, HttpStatus status, String traceId) {
        ApiErrorResponse body = new ApiErrorResponse(message, traceId, Instant.now());
        return ResponseEntity.status(status).body(body);
    }
}
