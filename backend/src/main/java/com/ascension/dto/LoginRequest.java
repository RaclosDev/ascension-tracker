package com.ascension.dto;

/** Body of POST /api/auth/login: the Google ID token from the sign-in button. */
public record LoginRequest(String token) {
}
