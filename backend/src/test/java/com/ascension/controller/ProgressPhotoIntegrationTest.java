package com.ascension.controller;

import com.ascension.TestcontainersConfiguration;
import com.ascension.service.PhotoStorage;
import com.ascension.service.UserService;
import com.ascension.support.DisabledIfDockerUnavailable;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.RequestBuilder;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Progress photos: only real images are stored, and only the client and a coach with body access see them. */
@SpringBootTest
@org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
@DisabledIfDockerUnavailable
@Import({TestcontainersConfiguration.class, ProgressPhotoIntegrationTest.MemoryStorage.class})
class ProgressPhotoIntegrationTest {

    private static final String WITH_BODY =
            "{\"training\":true,\"nutrition\":false,\"body\":true,\"editTraining\":false,\"editNutrition\":false}";
    private static final String WITHOUT_BODY = WITH_BODY.replace("\"body\":true", "\"body\":false");
    private static final byte[] WEBP = webp();
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16, 'J', 'F', 'I', 'F'};

    /** Keeps "stored" objects in memory so the tests never reach R2. */
    @TestConfiguration
    static class MemoryStorage {
        static final Map<String, byte[]> OBJECTS = new ConcurrentHashMap<>();
        static final java.util.concurrent.atomic.AtomicBoolean FAIL_DELETES = new java.util.concurrent.atomic.AtomicBoolean();

        @Bean
        @Primary
        PhotoStorage memoryPhotoStorage() {
            return new PhotoStorage() {
                @Override
                public boolean enabled() {
                    return true;
                }

                @Override
                public void put(String key, byte[] bytes, String contentType) {
                    OBJECTS.put(key, bytes);
                }

                @Override
                public String signedUrl(String key, Duration ttl) {
                    return "https://photos.test/" + key + "?ttl=" + ttl.toSeconds();
                }

                @Override
                public void delete(Collection<String> keys) {
                    if (FAIL_DELETES.get()) {
                        throw new IllegalStateException("R2 is down");
                    }
                    keys.forEach(OBJECTS::remove);
                }
            };
        }
    }

    @Autowired MockMvc mvc;
    @Autowired UserService users;
    @Autowired ObjectMapper json;
    @Autowired com.ascension.service.UserDataExportService exportService;
    @Autowired com.ascension.service.ProgressPhotoService photos;
    @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;

    @Test
    void theClientUploadsListsAndDeletesTheirPhotos() throws Exception {
        String client = user();
        String today = LocalDate.now().toString();

        String id = json.readTree(mvc.perform(upload(client, WEBP, "FRONT", today))
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.pose").value("FRONT"))
                        .andExpect(jsonPath("$.takenOn").value(today))
                        .andExpect(jsonPath("$.sizeBytes").value(WEBP.length))
                        .andReturn().getResponse().getContentAsString())
                .get("id").asString();
        mvc.perform(upload(client, JPEG, "SIDE", LocalDate.now().minusDays(7).toString()))
                .andExpect(status().isCreated());

        mvc.perform(as(get("/api/progress-photos"), client))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true))
                .andExpect(jsonPath("$.photos.length()").value(2))
                .andExpect(jsonPath("$.photos[0].id").value(id))
                .andExpect(jsonPath("$.photos[0].url").value(org.hamcrest.Matchers.endsWith(".webp?ttl=900")))
                .andExpect(jsonPath("$.photos[1].url").value(org.hamcrest.Matchers.containsString(".jpg")));

        assertThat(exportService.exportUserData(client).getProgressPhotos())
                .extracting(p -> p.pose().name(), p -> p.contentType())
                .containsExactly(org.assertj.core.groups.Tuple.tuple("SIDE", "image/jpeg"),
                        org.assertj.core.groups.Tuple.tuple("FRONT", "image/webp"));

        // Another user can neither see nor delete them.
        String other = user();
        mvc.perform(as(get("/api/progress-photos"), other)).andExpect(jsonPath("$.photos.length()").value(0));
        mvc.perform(as(delete("/api/progress-photos/{id}", id), other)).andExpect(status().isNotFound());

        mvc.perform(as(delete("/api/progress-photos/{id}", id), client)).andExpect(status().isNoContent());
        mvc.perform(as(get("/api/progress-photos"), client)).andExpect(jsonPath("$.photos.length()").value(1));
        assertThat(MemoryStorage.OBJECTS.keySet()).noneMatch(k -> k.contains(id));
    }

    @Test
    void onlyRealSmallImagesWithAValidDateAreAccepted() throws Exception {
        String client = user();
        String today = LocalDate.now().toString();

        mvc.perform(upload(client, "<svg onload=alert(1)>".getBytes(StandardCharsets.UTF_8), "FRONT", today))
                .andExpect(status().isBadRequest());
        mvc.perform(upload(client, new byte[0], "FRONT", today)).andExpect(status().isBadRequest());
        byte[] huge = new byte[2 * 1024 * 1024 + 1];
        System.arraycopy(JPEG, 0, huge, 0, JPEG.length);
        mvc.perform(upload(client, huge, "FRONT", today)).andExpect(status().isBadRequest());
        mvc.perform(upload(client, WEBP, "TOP", today)).andExpect(status().isBadRequest());
        mvc.perform(upload(client, WEBP, "FRONT", LocalDate.now().plusDays(2).toString()))
                .andExpect(status().isBadRequest());

        mvc.perform(as(get("/api/progress-photos"), client)).andExpect(jsonPath("$.photos.length()").value(0));
    }

    @Test
    void theCoachSeesThePhotosOnlyWhileTheLinkSharesBodyData() throws Exception {
        String coach = coach();
        String client = user();
        String linkId = accept(client, invite(coach), WITH_BODY);
        mvc.perform(upload(client, WEBP, "BACK", LocalDate.now().toString())).andExpect(status().isCreated());

        String path = "/api/coach/clients/{linkId}/progress-photos";
        mvc.perform(as(get(path, linkId), coach))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.photos.length()").value(1))
                .andExpect(jsonPath("$.photos[0].pose").value("BACK"));

        // Another coach, or an unknown link, gets a 404.
        mvc.perform(as(get(path, linkId), coach())).andExpect(status().isNotFound());
        mvc.perform(as(get(path, UUID.randomUUID()), coach)).andExpect(status().isNotFound());

        // Without body access it is a 403.
        mvc.perform(as(patch("/api/coaching/coaches/{linkId}", linkId), client).contentType("application/json")
                        .content(WITHOUT_BODY))
                .andExpect(status().isNoContent());
        mvc.perform(as(get(path, linkId), coach)).andExpect(status().isForbidden());

        // An ended link is a 404.
        mvc.perform(as(post("/api/coaching/coaches/{linkId}/end", linkId), client)).andExpect(status().is2xxSuccessful());
        mvc.perform(as(get(path, linkId), coach)).andExpect(status().isNotFound());
    }

    @Test
    void deletingTheAccountRemovesTheStoredPhotos() throws Exception {
        String client = user();
        String id = json.readTree(mvc.perform(upload(client, WEBP, "FRONT", LocalDate.now().toString()))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asString();
        assertThat(MemoryStorage.OBJECTS.keySet()).anyMatch(k -> k.contains(id));

        mvc.perform(as(delete("/api/auth/account"), client)).andExpect(status().isOk());

        assertThat(MemoryStorage.OBJECTS.keySet()).noneMatch(k -> k.contains(id));
    }

    @Test
    void aDeletionR2RefusesIsQueuedAndRetriedLater() throws Exception {
        String client = user();
        String id = json.readTree(mvc.perform(upload(client, WEBP, "FRONT", LocalDate.now().toString()))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asString();

        MemoryStorage.FAIL_DELETES.set(true);
        try {
            mvc.perform(as(delete("/api/progress-photos/{id}", id), client)).andExpect(status().isNoContent());
        } finally {
            MemoryStorage.FAIL_DELETES.set(false);
        }
        assertThat(MemoryStorage.OBJECTS.keySet()).anyMatch(k -> k.contains(id));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM photo_object_deletions WHERE object_key LIKE ?",
                Integer.class, "%" + id + "%")).isEqualTo(1);

        photos.retryPendingDeletions();

        assertThat(MemoryStorage.OBJECTS.keySet()).noneMatch(k -> k.contains(id));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM photo_object_deletions WHERE object_key LIKE ?",
                Integer.class, "%" + id + "%")).isZero();
    }

    private RequestBuilder upload(String email, byte[] bytes, String pose, String takenOn) {
        return multipart("/api/progress-photos")
                .file(new MockMultipartFile("file", "photo", "application/octet-stream", bytes))
                .param("pose", pose)
                .param("takenOn", takenOn)
                .with(jwt().jwt(j -> j.subject(email).claim("email", email)));
    }

    private MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder request, String email) {
        return request.with(jwt().jwt(j -> j.subject(email).claim("email", email)));
    }

    private String invite(String coach) throws Exception {
        return json.readTree(mvc.perform(as(post("/api/coach/invitations"), coach))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("token").asString();
    }

    private String accept(String client, String token, String permissions) throws Exception {
        return json.readTree(mvc.perform(as(post("/api/coaching/invitations/{token}/accept", token), client)
                        .contentType("application/json").content(permissions))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("linkId").asString();
    }

    private String coach() throws Exception {
        String email = user();
        mvc.perform(as(post("/api/coach/profile"), email)).andExpect(status().isOk());
        return email;
    }

    private String user() {
        String email = UUID.randomUUID() + "@photos.test";
        users.ensureUserExists(email, "Photo Test", null);
        return email;
    }

    private static byte[] webp() {
        byte[] b = new byte[32];
        System.arraycopy("RIFF".getBytes(StandardCharsets.US_ASCII), 0, b, 0, 4);
        System.arraycopy("WEBPVP8 ".getBytes(StandardCharsets.US_ASCII), 0, b, 8, 8);
        return b;
    }
}
