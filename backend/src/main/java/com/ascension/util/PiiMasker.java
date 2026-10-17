package com.ascension.util;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Utility helper to mask Personally Identifiable Information (PII),
 * specifically email addresses and user identifiers, before printing to application logs.
 *
 * Uses HMAC-SHA256 with a configurable secret key (via APP_PII_SALT environment variable
 * or system property) to prevent rainbow-table and candidate dictionary attacks against logs.
 */
public final class PiiMasker {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final byte[] DEFAULT_DEV_SALT = "ascension-dev-salt-do-not-use-in-prod".getBytes(StandardCharsets.UTF_8);

    private PiiMasker() {}

    private static byte[] getSalt() {
        String envSalt = System.getenv("APP_PII_SALT");
        if (envSalt != null && !envSalt.isBlank()) {
            return envSalt.trim().getBytes(StandardCharsets.UTF_8);
        }
        String propSalt = System.getProperty("APP_PII_SALT");
        if (propSalt != null && !propSalt.isBlank()) {
            return propSalt.trim().getBytes(StandardCharsets.UTF_8);
        }
        return DEFAULT_DEV_SALT;
    }

    /**
     * Returns an HMAC-SHA256 keyed, deterministic 64-bit truncated pseudonym for the provided email.
     * Prevents dictionary and rainbow-table attacks against logged user identifiers.
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
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec secretKey = new SecretKeySpec(getSalt(), HMAC_ALGORITHM);
            mac.init(secretKey);
            byte[] digest = mac.doFinal(email.trim().toLowerCase().getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder("usr_");
            for (int i = 0; i < 8; i++) {
                sb.append(String.format("%02x", digest[i]));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            return "usr_masked";
        }
    }
}
