package com.ascension.controller;

import com.ascension.TestcontainersConfiguration;
import com.ascension.service.UserService;
import com.ascension.support.DisabledIfDockerUnavailable;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Health data and AI calls need the user's explicit, recorded and withdrawable consent. */
@SpringBootTest(properties = "app.consent.enforce=true")
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class ConsentIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired UserService users;

    @Test
    void healthWritesWaitForConsentAndStopWhenItIsWithdrawn() throws Exception {
        String user = user();
        mvc.perform(as(get("/api/consents"), user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value("2026-11-borrador"))
                .andExpect(jsonPath("$.consents").isEmpty());

        mvc.perform(weight(user))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CONSENT_REQUIRED"))
                .andExpect(jsonPath("$.consent").value("HEALTH_DATA"));

        mvc.perform(consents(user, """
                        [{"kind":"TERMS","granted":true},{"kind":"PRIVACY","granted":true},
                         {"kind":"HEALTH_DATA","granted":true},{"kind":"AI_HEALTH","granted":false}]"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.consents.HEALTH_DATA.granted").value(true))
                .andExpect(jsonPath("$.consents.HEALTH_DATA.version").value("2026-11-borrador"))
                .andExpect(jsonPath("$.consents.AI_HEALTH.granted").value(false));

        mvc.perform(weight(user)).andExpect(status().isOk());
        mvc.perform(as(post("/api/nutrition/ai/assistant-chat"), user)
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.consent").value("AI_HEALTH"));

        mvc.perform(consents(user, "[{\"kind\":\"HEALTH_DATA\",\"granted\":false}]"))
                .andExpect(jsonPath("$.consents.HEALTH_DATA.granted").value(false));
        mvc.perform(weight(user)).andExpect(status().isForbidden());
        // Reading what was stored stays open after withdrawing.
        mvc.perform(as(get("/api/weights"), user)).andExpect(status().isOk());
    }

    @Test
    void termsCannotBeWithdrawnAndCoachTermsAreNotSetByTheClient() throws Exception {
        String user = user();
        mvc.perform(consents(user, "[{\"kind\":\"TERMS\",\"granted\":false}]")).andExpect(status().isBadRequest());
        mvc.perform(consents(user, "[{\"kind\":\"COACH_TERMS\",\"granted\":true}]")).andExpect(status().isBadRequest());
        mvc.perform(consents(user, "[{\"kind\":\"NOPE\",\"granted\":true}]")).andExpect(status().isBadRequest());

        mvc.perform(as(post("/api/coach/profile"), user)).andExpect(status().isOk());
        mvc.perform(as(get("/api/consents"), user))
                .andExpect(jsonPath("$.consents.COACH_TERMS.granted").value(true))
                .andExpect(jsonPath("$.consents.TERMS").doesNotExist());
    }

    private MockHttpServletRequestBuilder weight(String user) {
        return as(post("/api/weights"), user).contentType(MediaType.APPLICATION_JSON)
                .content("{\"date\":\"" + LocalDate.now() + "\",\"weight\":70.5}");
    }

    private MockHttpServletRequestBuilder consents(String user, String list) {
        return as(post("/api/consents"), user).contentType(MediaType.APPLICATION_JSON)
                .content("{\"consents\":" + list + "}");
    }

    private MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder request, String email) {
        return request.with(jwt().jwt(j -> j.subject(email).claim("email", email)));
    }

    private String user() {
        String email = UUID.randomUUID() + "@consent.test";
        users.ensureUserExists(email, "Consent Test", null);
        return email;
    }
}
