package com.ascension.service.auth;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Which new passwords are accepted: {@link #MIN_LENGTH} characters to {@link #MAX_BYTES} bytes, none
 * of the most common ones and not the email itself. No uppercase or symbol rules: following NIST
 * SP 800-63B, length and rejecting known passwords protect more and annoy less.
 */
final class PasswordPolicy {

    static final int MIN_LENGTH = 8;
    /** BCrypt only reads the first 72 bytes: longer passwords are rejected instead of cut silently. */
    static final int MAX_BYTES = 72;

    private static final Set<String> COMMON = load();

    private PasswordPolicy() {
    }

    /** 400 with the reason when the password is not acceptable. The email may be null. */
    static void validate(String password, String email) {
        if (password == null || password.length() < MIN_LENGTH) {
            throw invalid("La contraseña debe tener al menos " + MIN_LENGTH + " caracteres.");
        }
        if (tooLong(password)) {
            throw invalid("La contraseña es demasiado larga.");
        }
        String lower = password.toLowerCase(Locale.ROOT);
        if (COMMON.contains(lower) || lower.chars().distinct().count() == 1) {
            throw invalid("Esa contraseña es de las más usadas y fácil de adivinar. Elige otra.");
        }
        if (email != null) {
            String lowerEmail = email.toLowerCase(Locale.ROOT);
            String local = lowerEmail.split("@", 2)[0];
            if (lower.equals(lowerEmail) || lower.equals(local)) {
                throw invalid("La contraseña no puede ser tu email.");
            }
        }
    }

    static boolean tooLong(String password) {
        return password.getBytes(StandardCharsets.UTF_8).length > MAX_BYTES;
    }

    private static ResponseStatusException invalid(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private static Set<String> load() {
        try (InputStream in = PasswordPolicy.class.getResourceAsStream("/common-passwords.txt")) {
            if (in == null) {
                throw new IllegalStateException("common-passwords.txt is missing");
            }
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
                return reader.lines()
                        .map(String::trim)
                        .filter(line -> !line.isEmpty() && !line.startsWith("#"))
                        .map(line -> line.toLowerCase(Locale.ROOT))
                        .collect(Collectors.toUnmodifiableSet());
            }
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
