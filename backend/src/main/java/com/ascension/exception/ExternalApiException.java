package com.ascension.exception;

import org.springframework.http.HttpStatus;

public class ExternalApiException extends RuntimeException {
    private final HttpStatus status;
    private final String serviceName;

    public ExternalApiException(String serviceName, HttpStatus status, String message) {
        super(message);
        this.serviceName = serviceName;
        this.status = status;
    }

    public ExternalApiException(String serviceName, HttpStatus status, String message, Throwable cause) {
        super(message, cause);
        this.serviceName = serviceName;
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public ExternalApiException(String message) {
        this("ExternalService", HttpStatus.BAD_GATEWAY, message);
    }

    public ExternalApiException(String message, Throwable cause) {
        this("ExternalService", HttpStatus.BAD_GATEWAY, message, cause);
    }

    public String getServiceName() {
        return serviceName;
    }
}
