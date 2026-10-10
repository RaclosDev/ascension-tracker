package com.ascension.exception;

import java.time.Instant;

public class ApiErrorResponse {
    private String error;
    private String trace_id;
    private Instant timestamp;

    public ApiErrorResponse() {
    }

    public ApiErrorResponse(String error, String trace_id, Instant timestamp) {
        this.error = error;
        this.trace_id = trace_id;
        this.timestamp = timestamp;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getTrace_id() {
        return trace_id;
    }

    public void setTrace_id(String trace_id) {
        this.trace_id = trace_id;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
