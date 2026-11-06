package com.ascension.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.ascension.exception.EntityNotFoundException;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

class UserIdLookupTest {

    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final UserIdLookup lookup = new UserIdLookup(jdbc);

    @Test
    void findsTheIdWithTheNormalizedEmail() {
        UUID id = UUID.randomUUID();
        when(jdbc.queryForList(anyString(), eq(UUID.class), eq("ana@example.com"))).thenReturn(List.of(id));

        assertThat(lookup.find("  Ana@Example.com ")).contains(id);
        assertThat(lookup.require("ANA@example.com")).isEqualTo(id);
    }

    @Test
    void missingUserIsANotFoundThatTheApiMapsTo404() {
        when(jdbc.queryForList(anyString(), eq(UUID.class), eq("nadie@example.com"))).thenReturn(List.of());

        assertThat(lookup.find("nadie@example.com")).isEmpty();
        assertThatThrownBy(() -> lookup.require("nadie@example.com")).isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void blankEmailNeverHitsTheDatabase() {
        assertThat(lookup.find(" ")).isEmpty();
        assertThat(lookup.find(null)).isEmpty();
        verifyNoInteractions(jdbc);
    }
}
