package com.ascension.controller;

import com.ascension.TestcontainersConfiguration;
import com.ascension.controller.PasswordAuthIntegrationTest.CapturingEmailSender;
import com.ascension.service.UserService;
import com.ascension.service.auth.EmailSender;
import com.ascension.support.DisabledIfDockerUnavailable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * An account created with someone else's address must not be able to link a coach, receive push
 * notifications or be an administrator until the owner of the address confirms it, and the real owner
 * taking the account over (Google or password reset) closes what was set up before.
 */
@SpringBootTest(properties = "app.admin.emails=boss@verification.test")
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import({TestcontainersConfiguration.class, PasswordAuthIntegrationTest.Mail.class})
class EmailVerificationIntegrationTest {

    private static final String PERMISSIONS =
            "{\"training\":true,\"nutrition\":true,\"body\":false,\"editTraining\":false,\"editNutrition\":false}";
    private static final String SUBSCRIPTION =
            "{\"endpoint\":\"https://fcm.googleapis.com/fcm/send/%s\",\"keys\":{\"p256dh\":\"p256\",\"auth\":\"auth\"}}";

    @Autowired MockMvc mvc;
    @Autowired CapturingEmailSender mail;
    @Autowired UserService users;
    @Autowired JdbcTemplate jdbc;

    private String ip;

    @BeforeEach
    void freshClient() {
        mail.available = true;
        mail.sent.clear();
        ThreadLocalRandom random = ThreadLocalRandom.current();
        ip = "10." + random.nextInt(256) + "." + random.nextInt(256) + "." + random.nextInt(1, 255);
    }

    @Test
    void anUnverifiedAccountCannotLinkACoachOrSubscribeToPushUntilItUsesTheLinkFromItsEmail() throws Exception {
        String coach = coach();
        String invitation = invitation(coach);
        String email = register();

        mvc.perform(as(post("/api/coaching/invitations/{token}/accept", invitation), email)
                        .contentType(MediaType.APPLICATION_JSON).content(PERMISSIONS))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("Verifica tu email")));
        mvc.perform(as(post("/api/push/subscribe"), email).contentType(MediaType.APPLICATION_JSON)
                .content(SUBSCRIPTION.formatted(UUID.randomUUID()))).andExpect(status().isForbidden());
        assertThat(count("SELECT COUNT(*) FROM coach_clients cc JOIN users u ON u.id = cc.client_user_id WHERE u.email = ?",
                email)).isZero();

        String token = verificationToken(email);
        call("/api/auth/password/verify-email", "{\"token\":\"" + token + "\"}").andExpect(status().isNoContent());
        // The link works once.
        call("/api/auth/password/verify-email", "{\"token\":\"" + token + "\"}").andExpect(status().isBadRequest());

        mvc.perform(as(post("/api/coaching/invitations/{token}/accept", invitation), email)
                        .contentType(MediaType.APPLICATION_JSON).content(PERMISSIONS))
                .andExpect(status().isOk());
        mvc.perform(as(post("/api/push/subscribe"), email).contentType(MediaType.APPLICATION_JSON)
                .content(SUBSCRIPTION.formatted(UUID.randomUUID()))).andExpect(status().is2xxSuccessful());
    }

    @Test
    void anUnverifiedAdministratorEmailIsNotAnAdministrator() throws Exception {
        String boss = "boss@verification.test";
        call("/api/auth/password/register", PasswordAuthIntegrationTest.body(boss, PasswordAuthIntegrationTest.PASSWORD))
                .andExpect(status().isAccepted());
        mvc.perform(as(get("/api/admin/me"), boss)).andExpect(jsonPath("$.admin").value(false));
        mvc.perform(as(get("/api/admin/coaches"), boss)).andExpect(status().isForbidden());

        jdbc.update("UPDATE users SET email_verified = TRUE WHERE email = ?", boss);
        mvc.perform(as(get("/api/admin/me"), boss)).andExpect(jsonPath("$.admin").value(true));
    }

    @Test
    void googleSigningInToAnUnverifiedAccountClosesWhatWasSetUpBeforeAndLeavesANotice() throws Exception {
        String email = register();
        setUpLinkAndPush(email);

        users.ensureUserExists(email, "Dueño real", null, "google-sub-" + UUID.randomUUID());

        assertTakenOver(email);
        mvc.perform(as(get("/api/account/email"), email))
                .andExpect(jsonPath("$.verified").value(true))
                .andExpect(jsonPath("$.notice").value(org.hamcrest.Matchers.containsString("antes de que lo verificaras")));
        mvc.perform(as(delete("/api/account/email/notice"), email)).andExpect(status().isNoContent());
        mvc.perform(as(get("/api/account/email"), email)).andExpect(jsonPath("$.notice").doesNotExist());
    }

    @Test
    void aGoogleAccountThatAlreadyWasVerifiedKeepsItsLinks() throws Exception {
        String email = register();
        setUpLinkAndPush(email);
        jdbc.update("UPDATE users SET email_verified = TRUE WHERE email = ?", email);

        users.ensureUserExists(email, "Dueño", null, "google-sub-" + UUID.randomUUID());

        assertThat(count("SELECT COUNT(*) FROM coach_clients cc JOIN users u ON u.id = cc.client_user_id "
                + "WHERE u.email = ? AND cc.status = 'ACTIVE'", email)).isEqualTo(1);
        assertThat(count("SELECT COUNT(*) FROM push_subscriptions WHERE user_email = ?", email)).isEqualTo(1);
        mvc.perform(as(get("/api/account/email"), email)).andExpect(jsonPath("$.notice").doesNotExist());
    }

    @Test
    void resettingThePasswordFromTheEmailProvesOwnershipAndClosesWhatWasSetUpBefore() throws Exception {
        String email = register();
        setUpLinkAndPush(email);
        call("/api/auth/password/reset-request", "{\"email\":\"" + email + "\"}").andExpect(status().isAccepted());
        String token = lastToken(email, "restablecer-contrasena");

        call("/api/auth/password/reset", PasswordAuthIntegrationTest.reset(token, "nueva-clave-segura-7"))
                .andExpect(status().is2xxSuccessful());

        assertTakenOver(email);
    }

    @Test
    void theLinkCanBeRequestedAgainOncePerMinuteAndOnlyByAnUnverifiedAccount() throws Exception {
        String email = register();
        mail.sent.clear();

        mvc.perform(as(post("/api/account/email/resend"), email)).andExpect(status().isAccepted());
        assertThat(mail.sent).singleElement().satisfies(sent -> assertThat(sent.text()).contains("/verificar-email#token="));
        mvc.perform(as(post("/api/account/email/resend"), email)).andExpect(status().isTooManyRequests());

        String verified = coach();
        mvc.perform(as(post("/api/account/email/resend"), verified)).andExpect(status().isAccepted());
        assertThat(mail.sent).hasSize(1);
    }

    // ---- Helpers ----

    private void assertTakenOver(String email) {
        assertThat(count("SELECT COUNT(*) FROM coach_clients cc JOIN users u ON u.id = cc.client_user_id "
                + "WHERE u.email = ? AND cc.status = 'ACTIVE'", email)).isZero();
        assertThat(count("SELECT COUNT(*) FROM coach_clients cc JOIN users u ON u.id = cc.client_user_id "
                + "WHERE u.email = ? AND cc.status = 'ENDED' AND cc.ended_at IS NOT NULL", email)).isEqualTo(1);
        assertThat(count("SELECT COUNT(*) FROM push_subscriptions WHERE user_email = ?", email)).isZero();
        assertThat(jdbc.queryForObject("SELECT email_verified FROM users WHERE email = ?", Boolean.class, email)).isTrue();
        assertThat(jdbc.queryForObject("SELECT account_notice FROM users WHERE email = ?", String.class, email)).isNotBlank();
    }

    /** What an impostor could have prepared: a coach link (made before the gate) and a push subscription. */
    private void setUpLinkAndPush(String email) throws Exception {
        String coach = coach();
        String invitation = invitation(coach);
        jdbc.update("UPDATE users SET email_verified = TRUE WHERE email = ?", email);
        mvc.perform(as(post("/api/coaching/invitations/{token}/accept", invitation), email)
                        .contentType(MediaType.APPLICATION_JSON).content(PERMISSIONS))
                .andExpect(status().isOk());
        mvc.perform(as(post("/api/push/subscribe"), email).contentType(MediaType.APPLICATION_JSON)
                .content(SUBSCRIPTION.formatted(UUID.randomUUID()))).andExpect(status().is2xxSuccessful());
        jdbc.update("UPDATE users SET email_verified = FALSE WHERE email = ?", email);
    }

    private String register() throws Exception {
        String email = PasswordAuthIntegrationTest.email();
        call("/api/auth/password/register", PasswordAuthIntegrationTest.body(email, PasswordAuthIntegrationTest.PASSWORD))
                .andExpect(status().isAccepted());
        assertThat(jdbc.queryForObject("SELECT email_verified FROM users WHERE email = ?", Boolean.class, email)).isFalse();
        return email;
    }

    private String verificationToken(String email) {
        return lastToken(email, "verificar-email");
    }

    private String lastToken(String email, String page) {
        Pattern pattern = Pattern.compile(page + "#token=([A-Za-z0-9_-]+)");
        for (int i = mail.sent.size() - 1; i >= 0; i--) {
            EmailSender.Email sent = mail.sent.get(i);
            Matcher matcher = pattern.matcher(sent.text());
            if (sent.to().equals(email) && matcher.find()) {
                return matcher.group(1);
            }
        }
        throw new AssertionError("No email for " + email);
    }

    private String coach() throws Exception {
        String email = UUID.randomUUID() + "@verification.test";
        users.ensureUserExists(email, "Coach Test", null);
        mvc.perform(as(post("/api/coach/profile"), email)).andExpect(status().isOk());
        return email;
    }

    private String invitation(String coach) throws Exception {
        String body = mvc.perform(as(post("/api/coach/invitations"), coach)).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return com.jayway.jsonpath.JsonPath.read(body, "$.token");
    }

    private ResultActions call(String path, String json) throws Exception {
        String address = ip;
        return mvc.perform(post(path).header("Origin", PasswordAuthIntegrationTest.ORIGIN)
                .with(r -> {
                    r.setRemoteAddr(address);
                    return r;
                }).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder request, String email) {
        return request.with(jwt().jwt(j -> j.subject(email).claim("email", email)));
    }

    private int count(String sql, String email) {
        return jdbc.queryForObject(sql, Integer.class, email);
    }
}
