package com.ascension.util;

import com.ascension.exception.EntityNotFoundException;
import java.util.Locale;

/** Single place that decides how an email is compared and stored: trimmed and lower-cased. */
public final class Emails {

    private Emails() {
    }

    /** Trims and lower-cases the email. Null stays null. */
    public static String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    /** Like {@link #normalize(String)} but a missing or blank email means there is no such user. */
    public static String normalizeRequired(String email) {
        if (email == null || email.isBlank()) {
            throw new EntityNotFoundException("Usuario no encontrado");
        }
        return normalize(email);
    }
}
