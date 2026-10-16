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

    private static final byte[] LOG_SALT = "ascension-log-pseudonym-v1-salt".getBytes(StandardCharsets.UTF_8);

    private PiiMasker() {}

    /**
     * Returns a salted, deterministic 64-bit truncated SHA-256 pseudonym for the provided email.
     * Salting prevents rainbow-table / precomputed dictionary attacks against logs.
     * Example: "athlete@example.com" -> "usr_3a9f1b2c4d5e6f7a"
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
            md.update(LOG_SALT);
            byte[] digest = md.digest(email.trim().toLowerCase().getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder("usr_");
            for (int i = 0; i < 8; i++) {
                sb.append(String.format("%02x", digest[i]));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            return "usr_masked";
        }
    }
}
