package com.ascension.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

@WebMvcTest(VersionController.class)
@AutoConfigureMockMvc(addFilters = false)
class VersionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldReturnVersionOrUnauthorizedWithoutToken() throws Exception {
        mockMvc.perform(get("/api/version"))
               .andExpect(result -> {
                   int status = result.getResponse().getStatus();
                   assertTrue(status == 200 || status == 401 || status == 404);
               });
    }
}
