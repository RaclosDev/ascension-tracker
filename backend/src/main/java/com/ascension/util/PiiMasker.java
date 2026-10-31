package com.ascension.util;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Masks emails and OAuth subjects for logs with HMAC-SHA256 keyed by APP_PII_SALT (env var or
 * system property), so logged identifiers resist dictionary and rainbow-table attacks.
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
     * Returns a deterministic 64-bit pseudonym, e.g. "athlete@example.com" -> "usr_3a9f1b2c4d5e6f7a".
     *
     * @return the pseudonym, or "[anonymous]" if null/empty
     */
    public static String maskEmail(String email) {
        return pseudonym(email == null ? null : email.trim().toLowerCase(), "usr_");
    }

    /**
     * Same pseudonym for a Google "sub", so security alerts stay correlatable without the raw ID.
     *
     * @return the pseudonym, or "[anonymous]" if null/empty
     */
    public static String maskSubject(String subject) {
        return pseudonym(subject == null ? null : subject.trim(), "sub_");
    }

    private static String pseudonym(String value, String prefix) {
        if (value == null || value.isEmpty()) {
            return "[anonymous]";
        }
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec secretKey = new SecretKeySpec(getSalt(), HMAC_ALGORITHM);
            mac.init(secretKey);
            byte[] digest = mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(prefix);
            for (int i = 0; i < 8; i++) {
                sb.append(String.format("%02x", digest[i]));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            return prefix + "masked";
        }
    }
}
