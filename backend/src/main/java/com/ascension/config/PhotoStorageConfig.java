package com.ascension.config;

import com.ascension.service.PhotoStorage;
import com.ascension.service.R2PhotoStorage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.stream.Stream;

/** Progress photos go to Cloudflare R2 when all four R2 variables are set; otherwise uploads are off. */
@Slf4j
@Configuration
public class PhotoStorageConfig {

    @Bean
    PhotoStorage photoStorage(@Value("${app.storage.r2.endpoint:}") String endpoint,
                              @Value("${app.storage.r2.bucket:}") String bucket,
                              @Value("${app.storage.r2.access-key-id:}") String accessKeyId,
                              @Value("${app.storage.r2.secret-access-key:}") String secretAccessKey) {
        if (Stream.of(endpoint, bucket, accessKeyId, secretAccessKey).anyMatch(v -> v == null || v.isBlank())) {
            log.info("R2 is not configured: progress photo uploads are disabled");
            return PhotoStorage.disabled();
        }
        return new R2PhotoStorage(endpoint.trim(), bucket.trim(), accessKeyId.trim(), secretAccessKey.trim());
    }
}
