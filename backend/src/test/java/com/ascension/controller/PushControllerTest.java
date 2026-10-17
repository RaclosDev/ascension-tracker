package com.ascension.controller;

import com.ascension.service.PushNotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PushController.class)
class PushControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PushNotificationService pushService;

    private static final String TEST_EMAIL = "athlete@example.com";

    private SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor jwt() {
        return SecurityMockMvcRequestPostProcessors.jwt().jwt(builder -> builder.claim("email", TEST_EMAIL));
    }

    @Test
    @DisplayName("GET /api/push/vapid-key returns VAPID public key")
    void getVapidKey_returnsKey() throws Exception {
        when(pushService.getVapidPublicKey()).thenReturn("test-public-key");

        mockMvc.perform(get("/api/push/vapid-key")
                        .with(jwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publicKey").value("test-public-key"));
    }

    @Test
    @DisplayName("POST /api/push/subscribe registers a push subscription")
    void subscribe_savesSubscription() throws Exception {
        String json = """
                {
                    "endpoint": "https://fcm.googleapis.com/fcm/send/device123",
                    "keys": {
                        "p256dh": "key123",
                        "auth": "auth123"
                    }
                }
                """;

        mockMvc.perform(post("/api/push/subscribe")
                        .with(jwt())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk());

        verify(pushService).saveSubscription(eq(TEST_EMAIL), any());
    }

    @Test
    @DisplayName("POST /api/push/unsubscribe without endpoint unregisters all user subscriptions")
    void unsubscribe_allDevices() throws Exception {
        mockMvc.perform(post("/api/push/unsubscribe")
                        .with(jwt())
                        .with(csrf()))
                .andExpect(status().isOk());

        verify(pushService).removeSubscription(TEST_EMAIL);
        verify(pushService).cancelRestNotification(TEST_EMAIL);
    }

    @Test
    @DisplayName("POST /api/push/unsubscribe with endpoint unregisters only that specific endpoint")
    void unsubscribe_specificDevice() throws Exception {
        String json = """
                {
                    "endpoint": "https://fcm.googleapis.com/fcm/send/device123"
                }
                """;

        mockMvc.perform(post("/api/push/unsubscribe")
                        .with(jwt())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk());

        verify(pushService).removeSubscriptionByEndpoint("https://fcm.googleapis.com/fcm/send/device123", TEST_EMAIL);
    }

    @Test
    @DisplayName("POST /api/push/rest-timer schedules rest timer notification")
    void scheduleRest_schedulesNotification() throws Exception {
        String json = """
                {
                    "delaySec": 90
                }
                """;

        mockMvc.perform(post("/api/push/rest-timer")
                        .with(jwt())
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk());

        verify(pushService).scheduleRestNotification(TEST_EMAIL, 90);
    }

    @Test
    @DisplayName("POST /api/push/rest-timer/cancel cancels pending rest timer")
    void cancelRest_cancelsNotification() throws Exception {
        mockMvc.perform(post("/api/push/rest-timer/cancel")
                        .with(jwt())
                        .with(csrf()))
                .andExpect(status().isOk());

        verify(pushService).cancelRestNotification(TEST_EMAIL);
    }
}
