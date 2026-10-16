package com.ascension.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Utility helper to mask Personally Identifiable Information (PII),
 * specifically email addresses and user identifiers, before printing to application logs.
 *
 * Prevents raw email leakage into log aggregators and SIEM systems in accordance with
 * GDPR and security privacy best practices.
 */
public final class PiiMasker {

    private PiiMasker() {}

    /**
     * Returns a deterministic, truncated SHA-256 hash prefix for the provided email.
     * Example: "athlete@example.com" -> "usr_3a9f1b2c"
     *
     * @param email raw email string
     * @return masked pseudonym, or "[anonymous]" if null/empty
     */
    public static String maskEmail(String email) {
        if (email == null || email.isBlank()) {
            return "[anonymous]";
        }
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(email.trim().toLowerCase().getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder("usr_");
            for (int i = 0; i < 4; i++) {
                sb.append(String.format("%02x", digest[i]));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            return "usr_masked";
        }
    }
}
