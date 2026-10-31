package com.ascension.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @Transient
    private String plainToken;

    @Transient
    private String accessTokenSecurityVersion;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private Instant expiryDate;

    @Column(name = "replaced_at")
    private Instant replacedAt;

    @Column(name = "family_id", nullable = false, length = 64)
    private String familyId;

    @Column(name = "grace_used", nullable = false)
    private boolean graceUsed = false;

    public RefreshToken() {
    }

    public RefreshToken(String email, Instant expiryDate) {
        this(email, expiryDate, UUID.randomUUID().toString());
    }

    public RefreshToken(String email, Instant expiryDate, String familyId) {
        this.email = email;
        this.expiryDate = expiryDate;
        this.familyId = familyId != null ? familyId : UUID.randomUUID().toString();
        this.graceUsed = false;
        this.plainToken = UUID.randomUUID().toString();
        this.token = hashToken(this.plainToken);
    }

    @Deprecated
    public RefreshToken(String email, String name, String picture, Instant expiryDate) {
        this(email, expiryDate, UUID.randomUUID().toString());
    }

    @Deprecated
    public RefreshToken(String email, String name, String picture, Instant expiryDate, String familyId) {
        this(email, expiryDate, familyId);
    }

    public Long getId() { return id; }
    public String getToken() { return token; }
    public String getPlainToken() { return plainToken; }
    public String getAccessTokenSecurityVersion() { return accessTokenSecurityVersion; }
    public void setAccessTokenSecurityVersion(String version) { this.accessTokenSecurityVersion = version; }
    public void setToken(String token) { this.token = token; }
    public void setPlainToken(String plainToken) { this.plainToken = plainToken; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Instant getExpiryDate() { return expiryDate; }
    public void setExpiryDate(Instant expiryDate) { this.expiryDate = expiryDate; }
    public Instant getReplacedAt() { return replacedAt; }
    public void setReplacedAt(Instant replacedAt) { this.replacedAt = replacedAt; }
    public String getFamilyId() { return familyId; }
    public void setFamilyId(String familyId) { this.familyId = familyId; }
    public boolean isGraceUsed() { return graceUsed; }
    public void setGraceUsed(boolean graceUsed) { this.graceUsed = graceUsed; }

    public static String hashToken(String plain) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(plain.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
