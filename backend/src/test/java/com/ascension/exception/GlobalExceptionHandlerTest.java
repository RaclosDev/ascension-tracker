package com.ascension.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleInvalidInputException_returnsCustomMessage() {
        InvalidInputException ex = new InvalidInputException("El peso inicial no puede ser negativo");
        ResponseEntity<ApiErrorResponse> response = handler.handleInvalidInputException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("El peso inicial no puede ser negativo");
        assertThat(response.getBody().getTrace_id()).isNotBlank();
    }

    @Test
    void handleIllegalArgumentException_returnsCustomMessage() {
        IllegalArgumentException ex = new IllegalArgumentException("El formato del archivo es invalido");
        ResponseEntity<ApiErrorResponse> response = handler.handleIllegalArgumentException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("El formato del archivo es invalido");
    }

    @Test
    void handleHttpMessageNotReadable_whenCausedBySizeLimit_returnsPayloadTooLarge413() {
        IOException cause = new IOException("JSON payload exceeded maximum size limit of 5242880 bytes");
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException("Could not read document", cause, null);

        ResponseEntity<ApiErrorResponse> response = handler.handleHttpMessageNotReadable(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).contains("5MB");
    }

    @Test
    void handleHttpMessageNotReadable_whenMalformedJson_returnsBadRequest400() {
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException("Malformed JSON", (Throwable) null, null);

        ResponseEntity<ApiErrorResponse> response = handler.handleHttpMessageNotReadable(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).contains("Entrada invalida");
    }

    @Test
    void handleMaxUploadSizeExceededException_returnsPayloadTooLarge413() {
        org.springframework.web.multipart.MaxUploadSizeExceededException ex =
                new org.springframework.web.multipart.MaxUploadSizeExceededException(15728640);
        ResponseEntity<ApiErrorResponse> response = handler.handleMaxUploadSizeExceededException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).contains("tamaño máximo permitido");
    }

    @Test
    void handleUserDataQuotaExceededException_returnsTooManyRequests429() {
        UserDataQuotaExceededException ex = new UserDataQuotaExceededException("Límite de entrenamientos alcanzado (1001/1000).");
        ResponseEntity<ApiErrorResponse> response = handler.handleUserDataQuotaExceededException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).contains("Límite de entrenamientos alcanzado");
        assertThat(response.getBody().getTrace_id()).isNotBlank();
    }
    @Test
    void handleExternalApiException_when400BadRequest_returnsSpecificClientMessage() {
        ExternalApiException ex = new ExternalApiException("Gemini", HttpStatus.BAD_REQUEST, "Peticion bloqueada por filtros de seguridad");
        ResponseEntity<ApiErrorResponse> response = handler.handleExternalApiException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("Peticion bloqueada por filtros de seguridad");
        assertThat(response.getBody().getTrace_id()).isNotBlank();
    }

    @Test
    void handleExternalApiException_when502BadGateway_masksUpstreamMessage() {
        ExternalApiException ex = new ExternalApiException("Gemini", HttpStatus.BAD_GATEWAY, "Raw Google internal upstream error");
        ResponseEntity<ApiErrorResponse> response = handler.handleExternalApiException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("El servicio externo no está disponible temporalmente. Por favor, inténtalo más tarde.");
        assertThat(response.getBody().getTrace_id()).isNotBlank();
    }

    @Test
    void handleExternalApiException_when429TooManyRequests_returnsRateLimitMessage() {
        ExternalApiException ex = new ExternalApiException("Gemini", HttpStatus.TOO_MANY_REQUESTS, "Rate limit exceeded");
        ResponseEntity<ApiErrorResponse> response = handler.handleExternalApiException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getError()).isEqualTo("Límite de peticiones alcanzado en el servicio externo. Por favor, inténtalo más tarde.");
        assertThat(response.getBody().getTrace_id()).isNotBlank();
    }
}
