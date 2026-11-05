package com.ascension.service;

import java.time.Duration;
import java.util.Collection;

/** Private object storage for progress photos. Objects are only reachable through signed URLs. */
public interface PhotoStorage {

    /** False when no bucket is configured: photo uploads are switched off. */
    boolean enabled();

    void put(String key, byte[] bytes, String contentType);

    /** A URL that lets whoever holds it read the object until it expires. */
    String signedUrl(String key, Duration ttl);

    void delete(Collection<String> keys);

    /** Used when the R2 variables are not set, such as in local development. */
    static PhotoStorage disabled() {
        return new PhotoStorage() {
            @Override
            public boolean enabled() {
                return false;
            }

            @Override
            public void put(String key, byte[] bytes, String contentType) {
                throw new IllegalStateException("Photo storage is not configured");
            }

            @Override
            public String signedUrl(String key, Duration ttl) {
                throw new IllegalStateException("Photo storage is not configured");
            }

            @Override
            public void delete(Collection<String> keys) {
                // Nothing was ever stored.
            }
        };
    }
}
