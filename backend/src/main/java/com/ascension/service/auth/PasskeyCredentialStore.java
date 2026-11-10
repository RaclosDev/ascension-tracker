package com.ascension.service.auth;

import com.ascension.util.Emails;
import com.yubico.webauthn.CredentialRepository;
import com.yubico.webauthn.RegisteredCredential;
import com.yubico.webauthn.data.ByteArray;
import com.yubico.webauthn.data.PublicKeyCredentialDescriptor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.nio.ByteBuffer;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Passkeys as the WebAuthn library looks them up. The "username" is the account email and the
 * user handle is the 16 bytes of the account id: random, stable and without personal data.
 */
@Component
public class PasskeyCredentialStore implements CredentialRepository {

    private static final RowMapper<RegisteredCredential> CREDENTIAL = (rs, row) -> RegisteredCredential.builder()
            .credentialId(new ByteArray(rs.getBytes("credential_id")))
            .userHandle(new ByteArray(rs.getBytes("user_handle")))
            .publicKeyCose(new ByteArray(rs.getBytes("public_key_cose")))
            .signatureCount(rs.getLong("signature_count"))
            .build();

    private final JdbcTemplate jdbc;

    public PasskeyCredentialStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    static ByteArray userHandle(UUID userId) {
        ByteBuffer buffer = ByteBuffer.allocate(16);
        buffer.putLong(userId.getMostSignificantBits());
        buffer.putLong(userId.getLeastSignificantBits());
        return new ByteArray(buffer.array());
    }

    static Optional<UUID> userId(ByteArray userHandle) {
        if (userHandle == null || userHandle.size() != 16) {
            return Optional.empty();
        }
        ByteBuffer buffer = ByteBuffer.wrap(userHandle.getBytes());
        return Optional.of(new UUID(buffer.getLong(), buffer.getLong()));
    }

    @Override
    public Set<PublicKeyCredentialDescriptor> getCredentialIdsForUsername(String username) {
        Set<PublicKeyCredentialDescriptor> ids = new HashSet<>();
        jdbc.query("SELECT p.credential_id FROM passkeys p JOIN users u ON u.id = p.user_id WHERE LOWER(u.email) = ?",
                rs -> {
                    ids.add(PublicKeyCredentialDescriptor.builder().id(new ByteArray(rs.getBytes(1))).build());
                },
                Emails.normalize(username));
        return ids;
    }

    @Override
    public Optional<ByteArray> getUserHandleForUsername(String username) {
        return jdbc.queryForList("SELECT id FROM users WHERE LOWER(email) = ?", UUID.class, Emails.normalize(username))
                .stream().findFirst().map(PasskeyCredentialStore::userHandle);
    }

    @Override
    public Optional<String> getUsernameForUserHandle(ByteArray userHandle) {
        return userId(userHandle).flatMap(id -> jdbc.queryForList("SELECT email FROM users WHERE id = ?", String.class, id)
                .stream().findFirst());
    }

    @Override
    public Optional<RegisteredCredential> lookup(ByteArray credentialId, ByteArray userHandle) {
        return jdbc.query("""
                SELECT credential_id, user_handle, public_key_cose, signature_count
                FROM passkeys WHERE credential_id = ? AND user_handle = ?
                """, CREDENTIAL, credentialId.getBytes(), userHandle.getBytes()).stream().findFirst();
    }

    @Override
    public Set<RegisteredCredential> lookupAll(ByteArray credentialId) {
        return new HashSet<>(jdbc.query("""
                SELECT credential_id, user_handle, public_key_cose, signature_count
                FROM passkeys WHERE credential_id = ?
                """, CREDENTIAL, credentialId.getBytes()));
    }
}
