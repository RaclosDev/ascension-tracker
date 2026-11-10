package com.ascension.controller;

import com.ascension.TestcontainersConfiguration;
import com.ascension.service.UserService;
import com.ascension.service.auth.EmailSender;
import com.ascension.support.DisabledIfDockerUnavailable;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Direct sign-up, password sign-in and reset by link. */
@SpringBootTest
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import({TestcontainersConfiguration.class, PasswordAuthIntegrationTest.Mail.class})
class PasswordAuthIntegrationTest {

    static final String ORIGIN = "http://localhost:5173";
    static final String PASSWORD = "caballo-bateria-grapa";

    /** Keeps the emails instead of sending them. */
    static class CapturingEmailSender implements EmailSender {
        final List<Email> sent = new CopyOnWriteArrayList<>();
        boolean available = true;

        @Override
        public boolean enabled() {
            return available;
        }

        @Override
        public void send(Email email) {
            sent.add(email);
        }
    }

    @TestConfiguration
    static class Mail {
        @Bean
        @Primary
        CapturingEmailSender capturingEmailSender() {
            return new CapturingEmailSender();
        }
    }

    @Autowired MockMvc mvc;
    @Autowired CapturingEmailSender mail;
    @Autowired UserService users;
    @Autowired JdbcTemplate jdbc;

    private String ip;

    @BeforeEach
    void freshClient() {
        mail.available = true;
        mail.sent.clear();
        // Each test comes from its own address, so the per-IP login bucket never runs out.
        ThreadLocalRandom random = ThreadLocalRandom.current();
        ip = "10." + random.nextInt(256) + "." + random.nextInt(256) + "." + random.nextInt(1, 255);
    }

    @Test
    void signUpOpensASessionWithoutEmailAndThenSignsInWithThePassword() throws Exception {
        String email = email();
        mail.available = false;
        try {
            call("/api/auth/password/register", body(email, PASSWORD))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token").isString())
                    .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("refreshToken=")));
            assertThat(users.findByEmail(email)).isPresent();
            assertThat(users.hasUnverifiedEmail(email)).isTrue();
            assertThat(mail.sent).isEmpty();

            call("/api/auth/password/login", body(email.toUpperCase(), PASSWORD))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token").isString());
        } finally {
            mail.available = true;
        }
    }

    @Test
    void failedSignInsLookTheSameAndLockTheEmailAfterTen() throws Exception {
        String email = registered();
        String wrongPassword = call("/api/auth/password/login", body(email, "no-es-esta-clave"))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        String unknown = call("/api/auth/password/login", body(email(), PASSWORD))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        assertThat((String) JsonPath.read(wrongPassword, "$.error")).isEqualTo(JsonPath.read(unknown, "$.error"));

        String googleOnly = email();
        users.ensureUserExists(googleOnly, "Google", null, "sub-" + UUID.randomUUID());
        call("/api/auth/password/login", body(googleOnly, PASSWORD)).andExpect(status().isUnauthorized());

        for (int i = 1; i < 10; i++) {
            freshClient();
            call("/api/auth/password/login", body(email, "no-es-esta-clave")).andExpect(status().isUnauthorized());
        }
        freshClient();
        call("/api/auth/password/login", body(email, PASSWORD)).andExpect(status().isTooManyRequests());
    }

    @Test
    void signingUpWithATakenEmailReturnsConflict() throws Exception {
        String email = registeredWithoutEmail();
        mail.sent.clear();
        call("/api/auth/password/register", body(email, PASSWORD))
                .andExpect(status().isConflict());
        assertThat(mail.sent).isEmpty();
    }

    @Test
    void weakPasswordsAndBadEmailsAreRejected() throws Exception {
        call("/api/auth/password/register", body(email(), "corta")).andExpect(status().isBadRequest());
        call("/api/auth/password/register", body(email(), "password123"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(containsString("más usadas")));
        call("/api/auth/password/register", body("no-es-un-email", PASSWORD)).andExpect(status().isBadRequest());
        call("/api/auth/password/register", body(email(), "x".repeat(73))).andExpect(status().isBadRequest());
    }

    @Test
    void sessionEndpointsNeedATrustedOrigin() throws Exception {
        String email = registered();
        mvc.perform(post("/api/auth/password/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Origin", "https://evil.example")
                        .content(body(email(), PASSWORD)))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/password/login")
                        .with(request -> {
                            request.setRemoteAddr(ip);
                            return request;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Origin", "https://evil.example")
                        .content(body(email, PASSWORD)))
                .andExpect(status().isForbidden());
    }

    @Test
    void resetLinkChangesThePasswordOnceAndClosesTheOtherSessions() throws Exception {
        String email = registeredWithoutEmail();
        mail.sent.clear();
        call("/api/auth/password/reset-request", "{\"email\":\"" + email + "\"}").andExpect(status().isAccepted());
        String token = lastResetTokenFor(email);

        call("/api/auth/password/reset", reset(token, "123456789")).andExpect(status().isBadRequest());
        call("/api/auth/password/reset", reset(token, "nueva-clave-segura-7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString());
        call("/api/auth/password/reset", reset(token, "otra-clave-segura-8")).andExpect(status().isBadRequest());

        call("/api/auth/password/login", body(email, PASSWORD)).andExpect(status().isUnauthorized());
        call("/api/auth/password/login", body(email, "nueva-clave-segura-7")).andExpect(status().isOk());
        Integer tokens = jdbc.queryForObject(
                "SELECT COUNT(*) FROM password_reset_tokens t JOIN users u ON u.id = t.user_id WHERE u.email = ?",
                Integer.class, email);
        assertThat(tokens).isZero();
    }

    @Test
    void resetRequestsDoNotRevealAccounts() throws Exception {
        mail.sent.clear();
        call("/api/auth/password/reset-request", "{\"email\":\"" + email() + "\"}")
                .andExpect(status().isAccepted());
        assertThat(mail.sent).isEmpty();

        String googleOnly = email();
        users.ensureUserExists(googleOnly, "Google", null, "sub-" + UUID.randomUUID());
        call("/api/auth/password/reset-request", "{\"email\":\"" + googleOnly + "\"}")
                .andExpect(status().isAccepted());
        assertThat(mail.sent).singleElement().satisfies(sent -> assertThat(sent.text()).contains("Google"));
        // A second request within the minute sends nothing.
        call("/api/auth/password/reset-request", "{\"email\":\"" + googleOnly + "\"}")
                .andExpect(status().isAccepted());
        assertThat(mail.sent).hasSize(1);

        call("/api/auth/password/reset", reset("no-existe", "nueva-clave-segura-7")).andExpect(status().isBadRequest());
    }

    /** An account created without going through the sign-up endpoint. */
    String registeredWithoutEmail() {
        String email = email();
        jdbc.update("INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)",
                email, "Prueba", new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(4).encode(PASSWORD));
        return email;
    }

    String registered() throws Exception {
        String email = email();
        call("/api/auth/password/register", body(email, PASSWORD)).andExpect(status().isOk());
        return email;
    }

    ResultActions call(String path, String json) throws Exception {
        return mvc.perform(withClient(post(path)).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    MockHttpServletRequestBuilder withClient(MockHttpServletRequestBuilder request) {
        String address = ip;
        return request.header("Origin", ORIGIN).with(r -> {
            r.setRemoteAddr(address);
            return r;
        });
    }

    String lastResetTokenFor(String email) {
        return lastMatch(email, Pattern.compile("#token=([A-Za-z0-9_-]+)"));
    }

    private String lastMatch(String email, Pattern pattern) {
        for (int i = mail.sent.size() - 1; i >= 0; i--) {
            EmailSender.Email sent = mail.sent.get(i);
            Matcher matcher = pattern.matcher(sent.text());
            if (sent.to().equals(email) && matcher.find()) {
                return matcher.group(1);
            }
        }
        throw new AssertionError("No email for " + email);
    }

    static String email() {
        return "pw-" + UUID.randomUUID() + "@login.test";
    }

    static String body(String email, String password) {
        return "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
    }

    static String reset(String token, String password) {
        return "{\"token\":\"" + token + "\",\"password\":\"" + password + "\"}";
    }
}
