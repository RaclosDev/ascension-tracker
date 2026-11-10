package com.ascension.service.auth;

import com.ascension.service.auth.AuthAccounts.Account;
import com.ascension.util.PiiMasker;
import com.yubico.webauthn.AssertionRequest;
import com.yubico.webauthn.AssertionResult;
import com.yubico.webauthn.FinishAssertionOptions;
import com.yubico.webauthn.FinishRegistrationOptions;
import com.yubico.webauthn.RegistrationResult;
import com.yubico.webauthn.RelyingParty;
import com.yubico.webauthn.StartAssertionOptions;
import com.yubico.webauthn.StartRegistrationOptions;
import com.yubico.webauthn.data.AuthenticatorSelectionCriteria;
import com.yubico.webauthn.data.PublicKeyCredential;
import com.yubico.webauthn.data.PublicKeyCredentialCreationOptions;
import com.yubico.webauthn.data.ResidentKeyRequirement;
import com.yubico.webauthn.data.UserIdentity;
import com.yubico.webauthn.data.UserVerificationRequirement;
import com.yubico.webauthn.exception.AssertionFailedException;
import com.yubico.webauthn.exception.RegistrationFailedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Passkeys (WebAuthn): sign in with the fingerprint, face or PIN of the device. Each ceremony
 * starts with a single-use challenge kept for {@link #CHALLENGE_TTL}; the key must be discoverable
 * and verify the user, so a passkey alone is enough to sign in.
 */
@Service
public class PasskeyService {

    private static final Logger log = LoggerFactory.getLogger(PasskeyService.class);

    static final Duration CHALLENGE_TTL = Duration.ofMinutes(5);
    static final int MAX_PASSKEYS = 10;
    static final int MAX_NAME_LENGTH = 60;
    private static final int MAX_CREDENTIAL_JSON = 20_000;

    /** A ceremony in progress: its id and the options for navigator.credentials, as JSON. */
    public record Ceremony(String requestId, String optionsJson) {
    }

    /** A passkey as the account settings show it. */
    public record PasskeyView(long id, String name, Instant createdAt, Instant lastUsedAt) {
    }

    private record Challenge(UUID userId, String requestJson) {
    }

    private final JdbcTemplate jdbc;
    private final RelyingParty relyingParty;
    private final AuthAccounts accounts;

    public PasskeyService(JdbcTemplate jdbc, RelyingParty relyingParty, AuthAccounts accounts) {
        this.jdbc = jdbc;
        this.relyingParty = relyingParty;
        this.accounts = accounts;
    }

    /** Options to create a passkey for the signed-in account. */
    @Transactional
    public Ceremony startRegistration(String email) {
        Account account = requireAccount(email);
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM passkeys WHERE user_id = ?", Integer.class, account.id());
        if (count != null && count >= MAX_PASSKEYS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Ya tienes " + MAX_PASSKEYS + " llaves de acceso. Borra alguna para añadir otra.");
        }
        PublicKeyCredentialCreationOptions options = relyingParty.startRegistration(StartRegistrationOptions.builder()
                .user(UserIdentity.builder()
                        .name(account.email())
                        .displayName(account.name() != null && !account.name().isBlank() ? account.name() : account.email())
                        .id(PasskeyCredentialStore.userHandle(account.id()))
                        .build())
                .authenticatorSelection(AuthenticatorSelectionCriteria.builder()
                        .residentKey(ResidentKeyRequirement.REQUIRED)
                        .userVerification(UserVerificationRequirement.REQUIRED)
                        .build())
                .timeout(CHALLENGE_TTL.toMillis())
                .build());
        try {
            return newCeremony(account.id(), options.toJson(), options.toCredentialsCreateJson());
        } catch (IOException e) {
            throw new IllegalStateException("Could not serialise the registration options", e);
        }
    }

    /** Checks the new passkey against its challenge and saves it. */
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public PasskeyView finishRegistration(String email, String requestId, String credentialJson, String rawName) {
        Account account = requireAccount(email);
        Challenge challenge = consume(requestId)
                .filter(found -> account.id().equals(found.userId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Ha pasado demasiado tiempo. Vuelve a intentarlo."));
        RegistrationResult result;
        try {
            var credential = PublicKeyCredential.parseRegistrationResponseJson(limited(credentialJson));
            if (credentialExists(credential.getId().getBytes())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta llave de acceso ya está guardada.");
            }
            result = relyingParty.finishRegistration(FinishRegistrationOptions.builder()
                    .request(PublicKeyCredentialCreationOptions.fromJson(challenge.requestJson()))
                    .response(credential)
                    .build());
        } catch (RegistrationFailedException | IOException | IllegalArgumentException e) {
            log.info("Passkey registration rejected: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se ha podido guardar la llave de acceso.");
        }
        String name = cleanName(rawName);
        Instant now = Instant.now();
        // ON CONFLICT instead of catching the error: a failed statement would abort the transaction
        // and lose the challenge already consumed.
        List<Long> ids = jdbc.queryForList("""
                INSERT INTO passkeys (user_id, credential_id, user_handle, public_key_cose, signature_count, name, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (credential_id) DO NOTHING
                RETURNING id
                """, Long.class,
                account.id(),
                result.getKeyId().getId().getBytes(),
                PasskeyCredentialStore.userHandle(account.id()).getBytes(),
                result.getPublicKeyCose().getBytes(),
                result.getSignatureCount(),
                name,
                Timestamp.from(now));
        if (ids.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta llave de acceso ya está guardada.");
        }
        String masked = PiiMasker.maskEmail(account.email());
        log.info("Passkey added for {}", masked);
        return new PasskeyView(ids.getFirst(), name, now, null);
    }

    /** Options for the browser to offer the passkeys saved on the device. */
    @Transactional
    public Ceremony startLogin() {
        AssertionRequest request = relyingParty.startAssertion(StartAssertionOptions.builder()
                .userVerification(UserVerificationRequirement.REQUIRED)
                .timeout(CHALLENGE_TTL.toMillis())
                .build());
        try {
            return newCeremony(null, request.toJson(), request.toCredentialsGetJson());
        } catch (IOException e) {
            throw new IllegalStateException("Could not serialise the sign-in options", e);
        }
    }

    /**
     * Checks the signature of the passkey. Empty when it is not valid: expired or used challenge,
     * unknown (for instance deleted) passkey or wrong signature.
     */
    @Transactional
    public Optional<Account> finishLogin(String requestId, String credentialJson) {
        Optional<Challenge> challenge = consume(requestId).filter(found -> found.userId() == null);
        if (challenge.isEmpty()) {
            return Optional.empty();
        }
        try {
            AssertionResult result = relyingParty.finishAssertion(FinishAssertionOptions.builder()
                    .request(AssertionRequest.fromJson(challenge.get().requestJson()))
                    .response(PublicKeyCredential.parseAssertionResponseJson(limited(credentialJson)))
                    .build());
            if (!result.isSuccess()) {
                return Optional.empty();
            }
            byte[] credentialId = result.getCredential().getCredentialId().getBytes();
            jdbc.update("UPDATE passkeys SET signature_count = ?, last_used_at = ? WHERE credential_id = ?",
                    result.getSignatureCount(), Timestamp.from(Instant.now()), credentialId);
            return jdbc.queryForList("SELECT user_id FROM passkeys WHERE credential_id = ?", UUID.class, credentialId)
                    .stream().findFirst()
                    .flatMap(accounts::findById);
        } catch (AssertionFailedException | IOException | IllegalArgumentException e) {
            log.info("Passkey sign-in rejected: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /** Passkeys of the account, oldest first. */
    @Transactional(readOnly = true)
    public List<PasskeyView> list(String email) {
        Account account = requireAccount(email);
        return jdbc.query("SELECT id, name, created_at, last_used_at FROM passkeys WHERE user_id = ? ORDER BY created_at, id",
                (rs, row) -> {
                    Timestamp lastUsed = rs.getTimestamp("last_used_at");
                    return new PasskeyView(rs.getLong("id"), rs.getString("name"),
                            rs.getTimestamp("created_at").toInstant(), lastUsed == null ? null : lastUsed.toInstant());
                },
                account.id());
    }

    private boolean credentialExists(byte[] credentialId) {
        Boolean exists = jdbc.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM passkeys WHERE credential_id = ?)", Boolean.class, credentialId);
        return Boolean.TRUE.equals(exists);
    }

    /** Removes one passkey of the account. False when it does not exist or belongs to another account. */
    @Transactional
    public boolean delete(String email, long passkeyId) {
        Account account = requireAccount(email);
        boolean deleted = jdbc.update("DELETE FROM passkeys WHERE id = ? AND user_id = ?", passkeyId, account.id()) > 0;
        if (deleted) {
            String masked = PiiMasker.maskEmail(account.email());
            log.info("Passkey removed for {}", masked);
        }
        return deleted;
    }

    private Ceremony newCeremony(UUID userId, String requestJson, String optionsJson) {
        Instant now = Instant.now();
        jdbc.update("DELETE FROM passkey_challenges WHERE expires_at < ?", Timestamp.from(now));
        String id = AuthHashes.randomToken(32);
        jdbc.update("INSERT INTO passkey_challenges (id, user_id, request_json, expires_at) VALUES (?, ?, ?, ?)",
                id, userId, requestJson, Timestamp.from(now.plus(CHALLENGE_TTL)));
        return new Ceremony(id, optionsJson);
    }

    /** Takes the challenge out, so it can only be answered once. */
    private Optional<Challenge> consume(String requestId) {
        if (requestId == null || requestId.isBlank() || requestId.length() > 64) {
            return Optional.empty();
        }
        return jdbc.query("DELETE FROM passkey_challenges WHERE id = ? AND expires_at > ? RETURNING user_id, request_json",
                (rs, row) -> new Challenge(rs.getObject("user_id", UUID.class), rs.getString("request_json")),
                requestId, Timestamp.from(Instant.now())).stream().findFirst();
    }

    private Account requireAccount(String email) {
        return accounts.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión no válida."));
    }

    private static String limited(String credentialJson) {
        if (credentialJson == null || credentialJson.length() > MAX_CREDENTIAL_JSON) {
            throw new IllegalArgumentException("Missing or oversized credential");
        }
        return credentialJson;
    }

    static String cleanName(String rawName) {
        String name = rawName == null ? "" : rawName.strip().replaceAll("\\p{Cntrl}", "");
        if (name.isEmpty()) {
            return "Llave de acceso";
        }
        return name.length() > MAX_NAME_LENGTH ? name.substring(0, MAX_NAME_LENGTH) : name;
    }
}
