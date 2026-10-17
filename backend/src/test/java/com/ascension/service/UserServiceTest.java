package com.ascension.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class UserServiceTest {

    private JdbcTemplate jdbcTemplate;
    private UserService userService;

    @BeforeEach
    void setUp() {
        jdbcTemplate = mock(JdbcTemplate.class);
        userService = new UserService(jdbcTemplate);
    }

    @Test
    void findByEmail_whenUserExists_returnsUser() {
        Timestamp ts = Timestamp.from(Instant.now());
        UserService.User expected = new UserService.User("user@test.com", "Test User", "https://pic.url", "sub-123", ts.toInstant());

        when(jdbcTemplate.queryForObject(anyString(), any(RowMapper.class), eq("user@test.com")))
                .thenReturn(expected);

        Optional<UserService.User> user = userService.findByEmail("user@test.com");
        assertThat(user).isPresent();
        assertThat(user.get().googleSub()).isEqualTo("sub-123");
    }

    @Test
    void findByEmail_whenNotFound_returnsEmpty() {
        when(jdbcTemplate.queryForObject(anyString(), any(RowMapper.class), eq("notfound@test.com")))
                .thenThrow(new EmptyResultDataAccessException(1));

        Optional<UserService.User> user = userService.findByEmail("notfound@test.com");
        assertThat(user).isEmpty();
    }

    @Test
    void findByGoogleSub_whenUserExists_returnsUser() {
        UserService.User expected = new UserService.User("user@test.com", "Test User", null, "sub-456", null);
        when(jdbcTemplate.queryForObject(anyString(), any(RowMapper.class), eq("sub-456")))
                .thenReturn(expected);

        Optional<UserService.User> user = userService.findByGoogleSub("sub-456");
        assertThat(user).isPresent();
        assertThat(user.get().email()).isEqualTo("user@test.com");
    }

    @Test
    void getUserSecurityState_cachesResultAcrossCalls() {
        Timestamp ts = Timestamp.from(Instant.parse("2026-10-16T10:00:00Z"));
        when(jdbcTemplate.queryForObject(anyString(), eq(Timestamp.class), eq("cached@test.com")))
                .thenReturn(ts);

        UserService.UserSecurityState state1 = userService.getUserSecurityState("cached@test.com");
        UserService.UserSecurityState state2 = userService.getUserSecurityState("cached@test.com");

        assertThat(state1.exists()).isTrue();
        assertThat(state1.tokensValidAfter()).isEqualTo(ts.toInstant());
        assertThat(state2).isEqualTo(state1);

        // Verify DB was queried only once due to Caffeine cache
        verify(jdbcTemplate, times(1)).queryForObject(anyString(), eq(Timestamp.class), eq("cached@test.com"));
    }

    @Test
    void updateTokensValidAfter_updatesDatabaseAndRefreshesCache() {
        when(jdbcTemplate.update(anyString(), any(Timestamp.class), eq("user@test.com"))).thenReturn(1);

        Instant newTime = Instant.parse("2026-10-16T15:30:00Z");
        userService.updateTokensValidAfter("user@test.com", newTime);

        UserService.UserSecurityState state = userService.getUserSecurityState("user@test.com");
        assertThat(state.exists()).isTrue();
        assertThat(state.tokensValidAfter()).isEqualTo(newTime);

        // Verify no extra SELECT was made to DB because cache was populated by updateTokensValidAfter
        verify(jdbcTemplate, never()).queryForObject(anyString(), eq(Timestamp.class), eq("user@test.com"));
    }
}
