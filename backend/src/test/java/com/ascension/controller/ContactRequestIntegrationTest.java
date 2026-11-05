package com.ascension.controller;

import com.ascension.TestcontainersConfiguration;
import com.ascension.service.AccountDeletionService;
import com.ascension.service.UserService;
import com.ascension.support.DisabledIfDockerUnavailable;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "app.admin.emails=boss@contact.test",
        "app.coach.billing.transfer-holder=Ascension Test",
        "app.coach.billing.transfer-iban=ES00 TEST",
        "app.contact-email=hola@contact.test"})
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class ContactRequestIntegrationTest {

    private static final String ADMIN = "boss@contact.test";

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserService users;
    @Autowired AccountDeletionService accountDeletion;

    @Test
    void coachesSeePricesAndTransferDetails() throws Exception {
        String coach = user();
        mvc.perform(as(get("/api/coach/billing"), coach)).andExpect(status().isForbidden());
        mvc.perform(as(post("/api/coach/profile"), coach)).andExpect(status().isOk());
        mvc.perform(as(get("/api/coach/billing"), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.annualMonths").value(10))
                .andExpect(jsonPath("$.plans[?(@.id == 'PRO')].monthlyPriceEur").value(39))
                .andExpect(jsonPath("$.plans[?(@.id == 'PRO')].annualPriceEur").value(390))
                .andExpect(jsonPath("$.transferHolder").value("Ascension Test"))
                .andExpect(jsonPath("$.transferIban").value("ES00 TEST"));
    }

    @Test
    void anyoneSeesPricesAndTheContactEmailButNoBankDetails() throws Exception {
        mvc.perform(get("/api/public/info"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("max-age=3600")))
                .andExpect(jsonPath("$.annualMonths").value(10))
                .andExpect(jsonPath("$.plans[0].id").value("FREE"))
                .andExpect(jsonPath("$.plans[?(@.id == 'ELITE')].monthlyPriceEur").value(69))
                .andExpect(jsonPath("$.plans[?(@.id == 'ELITE')].maxClients").value(50))
                .andExpect(jsonPath("$.contactEmail").value("hola@contact.test"))
                .andExpect(jsonPath("$.transferHolder").doesNotExist())
                .andExpect(jsonPath("$.transferIban").doesNotExist());
    }

    @Test
    void aRequestReachesTheAdminWhoMarksItHandled() throws Exception {
        users.ensureUserExists(ADMIN, "Boss", null);
        String user = user();
        mvc.perform(as(post("/api/contact-requests"), user).contentType("application/json")
                        .content("{\"topic\":\"CUSTOM\",\"message\":\"  Tengo un gimnasio con 80 alumnos \",\"desiredClients\":80}"))
                .andExpect(status().isCreated());

        mvc.perform(as(get("/api/admin/contact-requests"), user)).andExpect(status().isForbidden());
        String id = jdbc.queryForObject("""
                SELECT r.id::text FROM contact_requests r JOIN users u ON u.id = r.user_id WHERE u.email = ?
                """, String.class, user);
        mvc.perform(as(get("/api/admin/contact-requests"), ADMIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '" + id + "')].message").value("Tengo un gimnasio con 80 alumnos"))
                .andExpect(jsonPath("$[?(@.id == '" + id + "')].desiredClients").value(80));

        mvc.perform(as(put("/api/admin/contact-requests/{id}/handled", id), ADMIN)
                        .contentType("application/json").content("{\"handled\":true}"))
                .andExpect(status().isNoContent());
        assertThat(jdbc.queryForObject("SELECT handled_at IS NOT NULL FROM contact_requests WHERE id = ?::uuid",
                Boolean.class, id)).isTrue();
        mvc.perform(as(put("/api/admin/contact-requests/{id}/handled", UUID.randomUUID()), ADMIN)
                        .contentType("application/json").content("{\"handled\":true}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void validatesLimitsExportsAndDeletesWithTheAccount() throws Exception {
        String user = user();
        mvc.perform(as(post("/api/contact-requests"), user).contentType("application/json")
                        .content("{\"topic\":\"SPAM\",\"message\":\"hola\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(as(post("/api/contact-requests"), user).contentType("application/json")
                        .content("{\"topic\":\"PLAN\",\"message\":\"   \"}"))
                .andExpect(status().isBadRequest());
        for (int i = 0; i < 3; i++) {
            mvc.perform(as(post("/api/contact-requests"), user).contentType("application/json")
                            .content("{\"topic\":\"PLAN\",\"message\":\"Quiero el plan Pro\"}"))
                    .andExpect(status().isCreated());
        }
        mvc.perform(as(post("/api/contact-requests"), user).contentType("application/json")
                        .content("{\"topic\":\"PLAN\",\"message\":\"Otra vez\"}"))
                .andExpect(status().isBadRequest());

        mvc.perform(as(get("/api/user/export"), user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contactRequests.length()").value(3))
                .andExpect(jsonPath("$.contactRequests[0].topic").value("PLAN"));

        UUID userId = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", UUID.class, user);
        accountDeletion.wipeAccountData(user);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM contact_requests WHERE user_id = ?",
                Integer.class, userId)).isZero();
    }

    private MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder request, String email) {
        return request.with(jwt().jwt(j -> j.subject(email).claim("email", email)));
    }

    private String user() {
        String email = UUID.randomUUID() + "@contact.test";
        users.ensureUserExists(email, "Contact Test", null);
        return email;
    }
}
