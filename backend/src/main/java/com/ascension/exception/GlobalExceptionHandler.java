package com.ascension.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Objects;
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

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolationException(ConstraintViolationException ex) {
        String traceId = UUID.randomUUID().toString();
        String errorMessage = ex.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessage)
                .findFirst()
                .orElse("Parametro invalido");
        log.warn("Constraint violation: {} [trace_id: {}]", errorMessage, traceId);
        return buildErrorResponse(errorMessage, HttpStatus.BAD_REQUEST, traceId);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ApiErrorResponse> handleHandlerMethodValidationException(HandlerMethodValidationException ex) {
        String traceId = UUID.randomUUID().toString();
        String errorMessage = ex.getAllValidationResults().stream()
                .flatMap(r -> r.getResolvableErrors().stream())
                .map(MessageSourceResolvable::getDefaultMessage)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse("Parametro invalido");
        log.warn("Handler method validation error: {} [trace_id: {}]", errorMessage, traceId);
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
        String msg = (ex.getMessage() != null && !ex.getMessage().isBlank()) ? ex.getMessage() : "Entrada invalida";
        return buildErrorResponse(msg, HttpStatus.BAD_REQUEST, traceId);
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex) {
        String traceId = UUID.randomUUID().toString();
        log.warn("Illegal argument: {} [trace_id: {}]", ex.getMessage(), traceId);
        String msg = (ex.getMessage() != null && !ex.getMessage().isBlank()) ? ex.getMessage() : "Entrada invalida";
        return buildErrorResponse(msg, HttpStatus.BAD_REQUEST, traceId);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        String traceId = UUID.randomUUID().toString();
        log.warn("Message not readable: {} [trace_id: {}]", ex.getMessage(), traceId);
        Throwable rootCause = ex.getMostSpecificCause();
        if (rootCause != null && rootCause.getMessage() != null && rootCause.getMessage().contains("JSON payload exceeded maximum size limit")) {
            return buildErrorResponse("El payload supera el tamaño máximo permitido (5MB)", HttpStatus.PAYLOAD_TOO_LARGE, traceId);
        }
        return buildErrorResponse("Entrada invalida o cuerpo de peticion malformado", HttpStatus.BAD_REQUEST, traceId);
    }

    @ExceptionHandler(DateTimeParseException.class)
    public ResponseEntity<ApiErrorResponse> handleDateTimeParseException(DateTimeParseException ex) {
        String traceId = UUID.randomUUID().toString();
        log.warn("Date parse error: {} [trace_id: {}]", ex.getMessage(), traceId);
        return buildErrorResponse("Formato de fecha invalido (esperado YYYY-MM-DD)", HttpStatus.BAD_REQUEST, traceId);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String traceId = UUID.randomUUID().toString();
        log.warn("Type mismatch error for param {}: {} [trace_id: {}]", ex.getName(), ex.getMessage(), traceId);
        return buildErrorResponse("Parametro '" + ex.getName() + "' invalido", HttpStatus.BAD_REQUEST, traceId);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingServletRequestParameter(MissingServletRequestParameterException ex) {
        String traceId = UUID.randomUUID().toString();
        log.warn("Missing required parameter {}: {} [trace_id: {}]", ex.getParameterName(), ex.getMessage(), traceId);
        return buildErrorResponse("El parametro '" + ex.getParameterName() + "' es obligatorio", HttpStatus.BAD_REQUEST, traceId);
    }

    @ExceptionHandler(AiQuotaExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleAiQuotaExceededException(AiQuotaExceededException ex) {
        String traceId = UUID.randomUUID().toString();
        log.warn("AI quota / circuit breaker exceeded: {} [trace_id: {}]", ex.getMessage(), traceId);
        return buildErrorResponse(ex.getMessage(), HttpStatus.TOO_MANY_REQUESTS, traceId);
    }

    @ExceptionHandler(UserDataQuotaExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleUserDataQuotaExceededException(UserDataQuotaExceededException ex) {
        String traceId = UUID.randomUUID().toString();
        log.warn("User data quota exceeded: {} [trace_id: {}]", ex.getMessage(), traceId);
        return buildErrorResponse(ex.getMessage(), HttpStatus.TOO_MANY_REQUESTS, traceId);
    }

    @ExceptionHandler(AiProcessingException.class)
    public ResponseEntity<ApiErrorResponse> handleAiProcessingException(AiProcessingException ex) {
        String traceId = UUID.randomUUID().toString();
        log.error("AI processing error: {} [trace_id: {}]", ex.getMessage(), traceId, ex);
        return buildErrorResponse("No se pudo procesar la solicitud con el servicio de IA.", HttpStatus.BAD_REQUEST, traceId);
    }

    @ExceptionHandler(ExternalApiException.class)
    public ResponseEntity<ApiErrorResponse> handleExternalApiException(ExternalApiException ex) {
        String traceId = UUID.randomUUID().toString();
        log.error("External API error in {}: {} (status: {}) [trace_id: {}]",
                ex.getServiceName(), ex.getMessage(), ex.getStatus(), traceId, ex);
        String clientMsg;
        if (ex.getStatus() == HttpStatus.TOO_MANY_REQUESTS) {
            clientMsg = "Límite de peticiones alcanzado en el servicio externo. Por favor, inténtalo más tarde.";
        } else if (ex.getStatus() == HttpStatus.BAD_REQUEST) {
            clientMsg = ex.getMessage() != null && !ex.getMessage().isBlank()
                    ? ex.getMessage()
                    : "Petición no válida al servicio externo.";
        } else {
            clientMsg = "El servicio externo no está disponible temporalmente. Por favor, inténtalo más tarde.";
        }
        return buildErrorResponse(clientMsg, ex.getStatus(), traceId);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleEntityNotFoundException(EntityNotFoundException ex) {
        String traceId = UUID.randomUUID().toString();
        log.warn("Entity not found: {} [trace_id: {}]", ex.getMessage(), traceId);
        return buildErrorResponse(ex.getMessage(), HttpStatus.NOT_FOUND, traceId);
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<ApiErrorResponse> handleOptimisticLockingFailureException(OptimisticLockingFailureException ex) {
        String traceId = UUID.randomUUID().toString();
        log.warn("Optimistic locking conflict [trace_id: {}]: {}", traceId, ex.getMessage());
        return buildErrorResponse("Conflicto de concurrencia: el recurso fue modificado por otra solicitud. Intentalo de nuevo.", HttpStatus.CONFLICT, traceId);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrityViolationException(DataIntegrityViolationException ex) {
        String traceId = UUID.randomUUID().toString();
        log.warn("Data integrity violation [trace_id: {}]: {}", traceId, ex.getMessage());
        return buildErrorResponse("Error de integridad de datos: el registro ya existe o viola una restriccion del sistema.", HttpStatus.BAD_REQUEST, traceId);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGlobalException(Exception ex) {
        String traceId = UUID.randomUUID().toString();
        log.error("Unhandled exception occurred [trace_id: {}]", traceId, ex);
        return buildErrorResponse("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR, traceId);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException ex) {
        String traceId = UUID.randomUUID().toString();
        log.warn("Max upload size exceeded: {} [trace_id: {}]", ex.getMessage(), traceId);
        return buildErrorResponse("El archivo supera el tamaño máximo permitido.", HttpStatus.PAYLOAD_TOO_LARGE, traceId);
    }

    private ResponseEntity<ApiErrorResponse> buildErrorResponse(String message, HttpStatus status, String traceId) {
        ApiErrorResponse body = new ApiErrorResponse(message, traceId, Instant.now());
        return ResponseEntity.status(status).body(body);
    }
}
