package com.ascension.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AccountDeletionServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private AccountDeletionService accountDeletionService;

    @Test
    void wipeAccountData_deletesFromUsersTableAndRelatedTables() {
        String testEmail = "test@example.com";

        accountDeletionService.wipeAccountData(testEmail);

        // Verify users table deletion is executed
        verify(jdbcTemplate).update("DELETE FROM users WHERE email = ?", testEmail);
        verify(jdbcTemplate).update("DELETE FROM workouts WHERE user_email = ?", testEmail);
    }
}
