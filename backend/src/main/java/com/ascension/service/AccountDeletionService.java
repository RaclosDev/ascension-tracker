package com.ascension.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountDeletionService {

    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public void wipeAccountData(String email) {
        String maskedUser = com.ascension.util.PiiMasker.maskEmail(email);
        log.warn("Initiating complete GDPR account wipe for user: {}", maskedUser);
        
        UserOwnedTables.deleteWorkoutsAndTemplates(jdbcTemplate, email);

        for (UserOwnedTables.Table table : UserOwnedTables.DIRECT) {
            int count = UserOwnedTables.deleteFrom(jdbcTemplate, table, email);
            if (count > 0) {
                log.info("Deleted {} rows from {} for user {}", count, table.name(), maskedUser);
            }
        }

        int userCount = jdbcTemplate.update("DELETE FROM users WHERE email = ?", email);
        if (userCount > 0) {
            log.info("Deleted {} rows from users for user {}", userCount, maskedUser);
        }
        
        log.warn("Account wipe completed for user: {}", maskedUser);
    }
}
