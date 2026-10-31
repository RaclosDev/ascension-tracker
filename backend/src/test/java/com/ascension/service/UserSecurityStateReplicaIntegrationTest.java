package com.ascension.service;

import com.ascension.TestcontainersConfiguration;
import com.ascension.support.DisabledIfDockerUnavailable;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.time.Instant;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class UserSecurityStateReplicaIntegrationTest {
    @Autowired UserService users;
    @Autowired JdbcTemplate jdbc;
    @Autowired PlatformTransactionManager manager;
    private final Instant before = Instant.parse("2026-10-01T00:00:00Z");
    private final Instant after = Instant.parse("2026-10-02T00:00:00Z");

    @Test
    void anotherReplicaImmediatelyObservesCommittedRevocation() {
        String email = user();
        var replica = new UserService(new JdbcTemplate(jdbc.getDataSource()));
        assertThat(replica.getUserSecurityState(email).tokensValidAfter()).isEqualTo(before);
        users.updateTokensValidAfter(email, after);
        assertThat(replica.getUserSecurityState(email).tokensValidAfter()).isEqualTo(after);
    }

    @Test
    void anotherReplicaImmediatelyObservesAccountDeletion() {
        String email = user();
        var replica = new UserService(new JdbcTemplate(jdbc.getDataSource()));
        assertThat(replica.getUserSecurityState(email).exists()).isTrue();
        jdbc.update("DELETE FROM users WHERE email = ?", email);
        assertThat(replica.getUserSecurityState(email).exists()).isFalse();
    }

    @Test
    void otherConnectionNeverObservesRolledBackRevocation() {
        String email = user();
        var replica = new UserService(new JdbcTemplate(jdbc.getDataSource()));
        var executor = java.util.concurrent.Executors.newSingleThreadExecutor();
        try {
            new TransactionTemplate(manager).executeWithoutResult(status -> {
                users.updateTokensValidAfter(email, after);
                try {
                    assertThat(executor.submit(() -> replica.getUserSecurityState(email)).get(5, java.util.concurrent.TimeUnit.SECONDS)
                            .tokensValidAfter()).isEqualTo(before);
                } catch (Exception exception) {
                    throw new IllegalStateException(exception);
                }
                status.setRollbackOnly();
            });
            assertThat(replica.getUserSecurityState(email).tokensValidAfter()).isEqualTo(before);
        } finally {
            executor.shutdownNow();
        }
    }

    private String user() {
        String email = UUID.randomUUID()+"@security-state.test";
        users.ensureUserExists(email, "State", null);
        users.updateTokensValidAfter(email, before);
        return email;
    }
}
