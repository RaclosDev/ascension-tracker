package com.ascension.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private UserService userService;

    @Test
    void ensureUserExists_withValidData_executesUpsert() {
        userService.ensureUserExists("test@example.com", "Test User", "https://pic.png");

        verify(jdbcTemplate).update(
                contains("INSERT INTO users"),
                eq("test@example.com"),
                eq("Test User"),
                eq("https://pic.png")
        );
    }

    @Test
    void ensureUserExists_singleEmail_executesUpsertWithNullNameAndPicture() {
        userService.ensureUserExists("solo@example.com");

        verify(jdbcTemplate).update(
                contains("INSERT INTO users"),
                eq("solo@example.com"),
                eq((String) null),
                eq((String) null)
        );
    }

    @Test
    void ensureUserExists_nullOrBlankEmail_throwsException() {
        assertThrows(IllegalArgumentException.class, () -> userService.ensureUserExists(null));
        assertThrows(IllegalArgumentException.class, () -> userService.ensureUserExists("   "));
        assertThrows(IllegalArgumentException.class, () -> userService.ensureUserExists("", "Name", "Pic"));
    }
}
