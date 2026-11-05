package com.ascension.service;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation;
import software.amazon.awssdk.core.checksums.ResponseChecksumValidation;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.Delete;
import software.amazon.awssdk.services.s3.model.ObjectIdentifier;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;
import java.time.Duration;
import java.util.Collection;
import java.util.List;

/** Cloudflare R2 through its S3-compatible API. R2 ignores the region, "auto" is what it expects. */
public class R2PhotoStorage implements PhotoStorage {

    private static final int DELETE_BATCH = 1000;

    private final String bucket;
    private final S3Client client;
    private final S3Presigner presigner;

    public R2PhotoStorage(String endpoint, String bucket, String accessKeyId, String secretAccessKey) {
        this.bucket = bucket;
        var credentials = StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKeyId, secretAccessKey));
        var s3Config = S3Configuration.builder().pathStyleAccessEnabled(true).build();
        URI uri = URI.create(endpoint);
        this.client = S3Client.builder()
                .endpointOverride(uri)
                .region(Region.of("auto"))
                .credentialsProvider(credentials)
                .serviceConfiguration(s3Config)
                // R2 rejects the newer default integrity checksums on some operations.
                .requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
                .responseChecksumValidation(ResponseChecksumValidation.WHEN_REQUIRED)
                .httpClientBuilder(UrlConnectionHttpClient.builder()
                        .connectionTimeout(Duration.ofSeconds(5))
                        .socketTimeout(Duration.ofSeconds(20)))
                .build();
        this.presigner = S3Presigner.builder()
                .endpointOverride(uri)
                .region(Region.of("auto"))
                .credentialsProvider(credentials)
                .serviceConfiguration(s3Config)
                .build();
    }

    @Override
    public boolean enabled() {
        return true;
    }

    @Override
    public void put(String key, byte[] bytes, String contentType) {
        client.putObject(b -> b.bucket(bucket).key(key).contentType(contentType)
                        .cacheControl("private, max-age=31536000, immutable"),
                RequestBody.fromBytes(bytes));
    }

    @Override
    public String signedUrl(String key, Duration ttl) {
        return presigner.presignGetObject(p -> p.signatureDuration(ttl)
                        .getObjectRequest(g -> g.bucket(bucket).key(key)))
                .url().toString();
    }

    @Override
    public void delete(Collection<String> keys) {
        List<ObjectIdentifier> ids = keys.stream().map(k -> ObjectIdentifier.builder().key(k).build()).toList();
        for (int i = 0; i < ids.size(); i += DELETE_BATCH) {
            List<ObjectIdentifier> batch = ids.subList(i, Math.min(ids.size(), i + DELETE_BATCH));
            // Quiet mode still lists the keys it could not delete; those must not pass as done.
            var failed = client.deleteObjects(d -> d.bucket(bucket)
                    .delete(Delete.builder().objects(batch).quiet(true).build())).errors();
            if (!failed.isEmpty()) {
                throw new IllegalStateException("R2 could not delete " + failed.size() + " objects: "
                        + failed.get(0).code());
            }
        }
    }
}
