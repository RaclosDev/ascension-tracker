package com.ascension.controller;

import com.ascension.TestcontainersConfiguration;
import com.ascension.service.UserService;
import com.ascension.support.DisabledIfDockerUnavailable;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.io.ByteArrayOutputStream;
import java.math.BigInteger;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.Signature;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Full passkey ceremonies against a software authenticator (attestation "none", ES256). */
@SpringBootTest
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class PasskeyIntegrationTest {

    static final String ORIGIN = "http://localhost:5173";
    static final Base64.Encoder B64 = Base64.getUrlEncoder().withoutPadding();
    static final Base64.Decoder B64D = Base64.getUrlDecoder();

    @Autowired MockMvc mvc;
    @Autowired UserService users;

    private String ip;

    @BeforeEach
    void freshClient() {
        ThreadLocalRandom random = ThreadLocalRandom.current();
        ip = "10." + random.nextInt(256) + "." + random.nextInt(256) + "." + random.nextInt(1, 255);
    }

    @Test
    void aSavedPasskeySignsInUntilItIsDeleted() throws Exception {
        String email = account();
        Authenticator device = new Authenticator();

        String created = register(email, device, "  Móvil\u0007  ");
        long id = ((Number) JsonPath.read(created, "$.id")).longValue();
        mvc.perform(get("/api/passkeys").with(user(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Móvil"));

        // The same authenticator cannot be saved twice.
        mvc.perform(registerRequest(email, device, null)).andExpect(status().isConflict());

        login(device).andExpect(status().isOk()).andExpect(jsonPath("$.token").isString());
        mvc.perform(get("/api/passkeys").with(user(email)))
                .andExpect(jsonPath("$[0].lastUsedAt").isNotEmpty());

        // Another account cannot delete it.
        String other = account();
        mvc.perform(delete("/api/passkeys/" + id).with(user(other))).andExpect(status().isNotFound());
        mvc.perform(delete("/api/passkeys/" + id).with(user(email))).andExpect(status().isNoContent());
        login(device).andExpect(status().isUnauthorized());
    }

    @Test
    void challengesAreSingleUseAndForgedAnswersFail() throws Exception {
        String email = account();
        Authenticator device = new Authenticator();
        register(email, device, null);

        String options = postJson(post("/api/auth/passkeys/login/options"), "{}");
        String requestId = JsonPath.read(options, "$.requestId");
        String challenge = JsonPath.read(options, "$.options.publicKey.challenge");
        String answer = device.assertion(challenge);
        login(requestId, answer).andExpect(status().isOk());
        login(requestId, answer).andExpect(status().isUnauthorized());

        String forgedOptions = postJson(post("/api/auth/passkeys/login/options"), "{}");
        String forged = new Authenticator(device.credentialId, device.userHandle).assertion(
                JsonPath.read(forgedOptions, "$.options.publicKey.challenge"));
        login(JsonPath.read(forgedOptions, "$.requestId"), forged).andExpect(status().isUnauthorized());
        login("no-existe", answer).andExpect(status().isUnauthorized());

        mvc.perform(client(post("/api/auth/passkeys/login"))
                        .header("Origin", "https://evil.example")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"requestId\":\"x\",\"credential\":{}}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void registrationNeedsItsOwnChallengeAndAValidCredential() throws Exception {
        String email = account();
        String options = postJson(post("/api/passkeys/options").with(user(email)), "{}");
        String requestId = JsonPath.read(options, "$.requestId");

        // A challenge issued to one account is useless to another.
        String other = account();
        mvc.perform(post("/api/passkeys").with(user(other)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"requestId\":\"" + requestId + "\",\"credential\":{}}"))
                .andExpect(status().isBadRequest());

        String fresh = postJson(post("/api/passkeys/options").with(user(email)), "{}");
        mvc.perform(post("/api/passkeys").with(user(email)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"requestId\":\"" + JsonPath.read(fresh, "$.requestId") + "\",\"credential\":{\"id\":\"x\"}}"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/passkeys").with(user(email))).andExpect(jsonPath("$.length()").value(0));
    }

    String register(String email, Authenticator device, String name) throws Exception {
        return mvc.perform(registerRequest(email, device, name))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
    }

    MockHttpServletRequestBuilder registerRequest(String email, Authenticator device, String name) throws Exception {
        String options = postJson(post("/api/passkeys/options").with(user(email)), "{}");
        String credential = device.attestation(JsonPath.read(options, "$.options.publicKey.challenge"),
                JsonPath.read(options, "$.options.publicKey.user.id"));
        String nameJson = name == null ? "null" : "\"" + name.replace("\u0007", "\\u0007") + "\"";
        return post("/api/passkeys").with(user(email)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"requestId\":\"" + JsonPath.read(options, "$.requestId") + "\",\"credential\":"
                        + credential + ",\"name\":" + nameJson + "}");
    }

    org.springframework.test.web.servlet.ResultActions login(Authenticator device) throws Exception {
        String options = postJson(post("/api/auth/passkeys/login/options"), "{}");
        return login(JsonPath.read(options, "$.requestId"),
                device.assertion(JsonPath.read(options, "$.options.publicKey.challenge")));
    }

    org.springframework.test.web.servlet.ResultActions login(String requestId, String credential) throws Exception {
        return mvc.perform(client(post("/api/auth/passkeys/login")).header("Origin", ORIGIN)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"requestId\":\"" + requestId + "\",\"credential\":" + credential + "}"));
    }

    String postJson(MockHttpServletRequestBuilder request, String json) throws Exception {
        return mvc.perform(client(request).contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
    }

    MockHttpServletRequestBuilder client(MockHttpServletRequestBuilder request) {
        String address = ip;
        return request.with(r -> {
            r.setRemoteAddr(address);
            return r;
        });
    }

    String account() {
        String email = "pk-" + UUID.randomUUID() + "@login.test";
        users.ensureUserExists(email, "Llaves", null);
        return email;
    }

    static org.springframework.test.web.servlet.request.RequestPostProcessor user(String email) {
        return jwt().jwt(j -> j.subject(email).claim("email", email));
    }

    /** A software authenticator with one ES256 key, like a phone with a fingerprint reader. */
    static final class Authenticator {
        final KeyPair keys;
        final byte[] credentialId;
        byte[] userHandle;
        int counter;

        Authenticator() throws Exception {
            this(randomBytes(16), null);
        }

        Authenticator(byte[] credentialId, byte[] userHandle) throws Exception {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("EC");
            generator.initialize(new ECGenParameterSpec("secp256r1"));
            this.keys = generator.generateKeyPair();
            this.credentialId = credentialId;
            this.userHandle = userHandle;
        }

        String attestation(String challenge, String userId) throws Exception {
            userHandle = B64D.decode(userId);
            byte[] clientData = clientData("webauthn.create", challenge);
            ByteArrayOutputStream authData = new ByteArrayOutputStream();
            authData.write(sha256("localhost".getBytes(StandardCharsets.UTF_8)));
            authData.write(0x45); // user present, user verified, attested credential data
            authData.write(ByteBuffer.allocate(4).putInt(counter).array());
            authData.write(new byte[16]); // AAGUID
            authData.write(ByteBuffer.allocate(2).putShort((short) credentialId.length).array());
            authData.write(credentialId);
            authData.write(coseKey());

            ByteArrayOutputStream attestation = new ByteArrayOutputStream();
            attestation.write(0xA3);
            text(attestation, "fmt");
            text(attestation, "none");
            text(attestation, "attStmt");
            attestation.write(0xA0);
            text(attestation, "authData");
            bytes(attestation, authData.toByteArray());

            return "{\"type\":\"public-key\",\"id\":\"" + B64.encodeToString(credentialId) + "\",\"rawId\":\""
                    + B64.encodeToString(credentialId) + "\",\"response\":{\"clientDataJSON\":\""
                    + B64.encodeToString(clientData) + "\",\"attestationObject\":\""
                    + B64.encodeToString(attestation.toByteArray()) + "\"},\"clientExtensionResults\":{}}";
        }

        String assertion(String challenge) throws Exception {
            byte[] clientData = clientData("webauthn.get", challenge);
            ByteArrayOutputStream authData = new ByteArrayOutputStream();
            authData.write(sha256("localhost".getBytes(StandardCharsets.UTF_8)));
            authData.write(0x05); // user present, user verified
            authData.write(ByteBuffer.allocate(4).putInt(++counter).array());
            byte[] authenticatorData = authData.toByteArray();

            Signature signer = Signature.getInstance("SHA256withECDSA");
            signer.initSign(keys.getPrivate());
            signer.update(authenticatorData);
            signer.update(sha256(clientData));

            return "{\"type\":\"public-key\",\"id\":\"" + B64.encodeToString(credentialId) + "\",\"rawId\":\""
                    + B64.encodeToString(credentialId) + "\",\"response\":{\"clientDataJSON\":\""
                    + B64.encodeToString(clientData) + "\",\"authenticatorData\":\""
                    + B64.encodeToString(authenticatorData) + "\",\"signature\":\""
                    + B64.encodeToString(signer.sign()) + "\",\"userHandle\":\""
                    + B64.encodeToString(userHandle) + "\"},\"clientExtensionResults\":{}}";
        }

        private byte[] coseKey() throws Exception {
            ECPublicKey publicKey = (ECPublicKey) keys.getPublic();
            ByteArrayOutputStream cose = new ByteArrayOutputStream();
            cose.write(new byte[]{(byte) 0xA5, 0x01, 0x02, 0x03, 0x26, 0x20, 0x01, 0x21});
            bytes(cose, fixed32(publicKey.getW().getAffineX()));
            cose.write(0x22);
            bytes(cose, fixed32(publicKey.getW().getAffineY()));
            return cose.toByteArray();
        }

        private static byte[] clientData(String type, String challenge) {
            return ("{\"type\":\"" + type + "\",\"challenge\":\"" + challenge + "\",\"origin\":\"" + ORIGIN
                    + "\",\"crossOrigin\":false}").getBytes(StandardCharsets.UTF_8);
        }

        private static byte[] fixed32(BigInteger value) {
            byte[] raw = value.toByteArray();
            byte[] out = new byte[32];
            int length = Math.min(raw.length, 32);
            System.arraycopy(raw, raw.length - length, out, 32 - length, length);
            return out;
        }

        private static void text(ByteArrayOutputStream out, String value) {
            byte[] raw = value.getBytes(StandardCharsets.UTF_8);
            out.write(0x60 | raw.length);
            out.writeBytes(raw);
        }

        private static void bytes(ByteArrayOutputStream out, byte[] value) {
            if (value.length < 24) {
                out.write(0x40 | value.length);
            } else {
                out.write(0x58);
                out.write(value.length);
            }
            out.writeBytes(value);
        }

        private static byte[] sha256(byte[] value) throws Exception {
            return MessageDigest.getInstance("SHA-256").digest(value);
        }

        private static byte[] randomBytes(int length) {
            byte[] out = new byte[length];
            ThreadLocalRandom.current().nextBytes(out);
            return out;
        }
    }
}
