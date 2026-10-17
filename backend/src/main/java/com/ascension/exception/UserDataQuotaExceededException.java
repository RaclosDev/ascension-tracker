package com.ascension.exception;

public class UserDataQuotaExceededException extends RuntimeException {
    public UserDataQuotaExceededException(String message) {
        super(message);
    }
}
