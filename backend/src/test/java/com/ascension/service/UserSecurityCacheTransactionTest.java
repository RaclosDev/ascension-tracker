package com.ascension.service;

import java.sql.Timestamp;
import java.time.Instant;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class UserSecurityCacheTransactionTest {
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final UserService service = new UserService(jdbc);
    private final Instant before = Instant.parse("2026-10-01T00:00:00Z");
    private final Instant after = Instant.parse("2026-10-02T00:00:00Z");

    @AfterEach void clearTransaction() { TransactionSynchronizationManager.clear(); }

    private void primeCache() {
        when(jdbc.queryForObject(anyString(), eq(Timestamp.class), eq("cache@example.com")))
                .thenReturn(Timestamp.from(before));
        when(jdbc.update(anyString(), any(Timestamp.class), eq("cache@example.com"))).thenReturn(1);
        assertThat(service.getUserSecurityState("cache@example.com").tokensValidAfter()).isEqualTo(before);
        TransactionSynchronizationManager.initSynchronization();
    }

    @Test void publishesRevocationOnlyAfterCommit() {
        primeCache();
        service.updateTokensValidAfter("cache@example.com", after);
        assertThat(service.getUserSecurityState("cache@example.com").tokensValidAfter()).isEqualTo(before);
        when(jdbc.queryForObject(anyString(), eq(Timestamp.class), eq("cache@example.com")))
                .thenReturn(Timestamp.from(after));
        TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
        assertThat(service.getUserSecurityState("cache@example.com").tokensValidAfter()).isEqualTo(after);
    }

    @Test void delayedCommitCallbackDoesNotRestoreOlderRevocationState() {
        primeCache();
        service.updateTokensValidAfter("cache@example.com", before);
        var firstCommit = TransactionSynchronizationManager.getSynchronizations();
        TransactionSynchronizationManager.clearSynchronization();
        TransactionSynchronizationManager.initSynchronization();
        service.updateTokensValidAfter("cache@example.com", after);
        when(jdbc.queryForObject(anyString(), eq(Timestamp.class), eq("cache@example.com")))
                .thenReturn(Timestamp.from(after));
        TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
        firstCommit.forEach(TransactionSynchronization::afterCommit);
        assertThat(service.getUserSecurityState("cache@example.com").tokensValidAfter()).isEqualTo(after);
    }

    @Test void rollbackDoesNotRevokeSessionsInCache() {
        primeCache();
        service.updateTokensValidAfter("cache@example.com", after);
        TransactionSynchronizationManager.getSynchronizations().forEach(s -> s.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));
        TransactionSynchronizationManager.clearSynchronization();
        assertThat(service.getUserSecurityState("cache@example.com").tokensValidAfter()).isEqualTo(before);
    }

    @Test void transactionalReadDoesNotPublishUncommittedState() {
        when(jdbc.queryForObject(anyString(), eq(Timestamp.class), eq("cache@example.com")))
                .thenReturn(Timestamp.from(after), Timestamp.from(before));
        TransactionSynchronizationManager.setActualTransactionActive(true);
        assertThat(service.getUserSecurityState("cache@example.com").tokensValidAfter()).isEqualTo(after);
        TransactionSynchronizationManager.setActualTransactionActive(false);
        assertThat(service.getUserSecurityState("cache@example.com").tokensValidAfter()).isEqualTo(before);
    }
}
