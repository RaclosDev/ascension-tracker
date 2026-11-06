package com.ascension.service;

import com.ascension.TestcontainersConfiguration;
import com.ascension.support.DisabledIfDockerUnavailable;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.LocalDate;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Push notifications around weekly check-ins. */
@SpringBootTest
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class CheckinNotificationIntegrationTest {

    private static final String PERMISSIONS =
            "{\"training\":true,\"nutrition\":false,\"body\":false,\"editTraining\":false,\"editNutrition\":false}";
    private static final String CHECKIN = "{\"energy\":4,\"sleep\":3,\"trainingAdherence\":5,\"dietAdherence\":4}";
    private static final String CLIENT_PATH = "/api/coaching/coaches/{linkId}/checkin";

    @MockitoBean PushNotificationService push;
    @Autowired CheckinNotifier notifier;
    @Autowired MockMvc mvc;
    @Autowired UserService users;
    @Autowired ObjectMapper json;

    @Test
    void theCoachHearsAboutANewCheckinAndTheClientAboutTheReply() throws Exception {
        String coach = user("Laura Coach");
        mvc.perform(as(post("/api/coach/profile"), coach)).andExpect(status().isOk());
        String client = user("Pablo Cliente");
        String linkId = accept(client, invite(coach));

        mvc.perform(as(put(CLIENT_PATH, linkId), client).contentType("application/json").content(CHECKIN))
                .andExpect(status().isOk());
        verify(push).sendAsync(coach, "Nuevo check-in", "Pablo ha enviado su check-in semanal.",
                "ascension-checkin-" + linkId, "/entrenador/alumnos/" + linkId);

        // Editing it does not notify the coach again.
        mvc.perform(as(put(CLIENT_PATH, linkId), client).contentType("application/json")
                .content(CHECKIN.replace("\"energy\":4", "\"energy\":2"))).andExpect(status().isOk());
        verify(push, times(1)).sendAsync(eq(coach), anyString(), anyString(), anyString(), anyString());

        String checkinId = json.readTree(mvc.perform(as(get("/api/coach/clients/{linkId}/checkins", linkId), coach))
                .andReturn().getResponse().getContentAsString()).get(0).get("id").asString();
        mvc.perform(as(put("/api/coach/clients/{linkId}/checkins/{id}/reply", linkId, checkinId), coach)
                .contentType("application/json").content("{\"reply\":\"Buen trabajo\"}")).andExpect(status().isOk());
        verify(push).sendAsync(client, "Tu entrenador ha respondido", "Laura ha contestado a tu check-in.",
                "ascension-checkin-" + linkId, "/checkin/" + linkId);
    }

    @Test
    void theSundayReminderGoesOnceToClientsWithoutThisWeeksCheckin() throws Exception {
        String coach = user("Marta Coach");
        mvc.perform(as(post("/api/coach/profile"), coach)).andExpect(status().isOk());
        String pending = user("Ana Pendiente");
        String done = user("Luis Hecho");
        String pendingLink = accept(pending, invite(coach));
        String doneLink = accept(done, invite(coach));
        mvc.perform(as(put(CLIENT_PATH, doneLink), done).contentType("application/json").content(CHECKIN))
                .andExpect(status().isOk());
        clearInvocations(push);

        notifier.remind(LocalDate.now());
        notifier.remind(LocalDate.now());

        verify(push, times(1)).sendAsync(pending, "Check-in semanal", "Cuéntale a Marta cómo te ha ido la semana.",
                "ascension-checkin-" + pendingLink, "/checkin/" + pendingLink);
        verify(push, never()).sendAsync(eq(done), anyString(), anyString(), anyString(), anyString());
    }

    private MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder request, String email) {
        return request.with(jwt().jwt(j -> j.subject(email).claim("email", email)));
    }

    private String invite(String coach) throws Exception {
        return json.readTree(mvc.perform(as(post("/api/coach/invitations"), coach))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("token").asString();
    }

    private String accept(String client, String token) throws Exception {
        return json.readTree(mvc.perform(as(post("/api/coaching/invitations/{token}/accept", token), client)
                        .contentType("application/json").content(PERMISSIONS))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("linkId").asString();
    }

    private String user(String name) {
        String email = UUID.randomUUID() + "@notify.test";
        users.ensureUserExists(email, name, null);
        return email;
    }
}
