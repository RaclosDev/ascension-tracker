package com.ascension.service;

import com.ascension.TestcontainersConfiguration;
import com.ascension.support.DisabledIfDockerUnavailable;
import com.ascension.model.RestTimerStatus;
import com.ascension.repository.RestTimerRepository;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@DisabledIfDockerUnavailable
@Import(TestcontainersConfiguration.class)
class RestTimerLeaseIntegrationTest {
    @Autowired RestTimerService service;
    @Autowired RestTimerRepository repository;
    @Autowired UserService users;
    private String user() {
        String email = UUID.randomUUID() + "@timer.test";
        users.ensureUserExists(email, "Timer", null);
        return email;
    }
    @Test void crashedWorkerClaimCanBeRecoveredWithoutLosingNotification() {
        Instant now = Instant.now();
        var timer = service.scheduleTimerAt(user(), now.minusSeconds(1));
        service.claimDueTimers(now, 100);
        assertThat(repository.findById(timer.getId()).orElseThrow().getStatus()).isEqualTo(RestTimerStatus.PROCESSING);
        assertThat(service.claimDueTimers(now.plusSeconds(91), 100)).extracting(t -> t.getId()).contains(timer.getId());
    }
    @Test void cancellingAClaimedTimerPreventsLaterDelivery() {
        Instant now = Instant.now();
        String email = user();
        var timer = service.scheduleTimerAt(email, now.minusSeconds(1));
        service.claimDueTimers(now, 100);
        service.cancelTimers(email);
        assertThat(repository.findById(timer.getId()).orElseThrow().getStatus()).isEqualTo(RestTimerStatus.CANCELLED);
    }
    @Test void staleWorkerCannotAcknowledgeNewClaim() {
        Instant now = Instant.now();
        var timer = service.scheduleTimerAt(user(), now.minusSeconds(1));
        var first = service.claimDueTimers(now, 100).stream().filter(t -> t.getId().equals(timer.getId())).findFirst().orElseThrow();
        var second = service.claimDueTimers(now.plusSeconds(91), 100).stream().filter(t -> t.getId().equals(timer.getId())).findFirst().orElseThrow();
        service.finishDelivery(first, true);
        assertThat(repository.findById(timer.getId()).orElseThrow().getStatus()).isEqualTo(RestTimerStatus.PROCESSING);
        service.finishDelivery(second, true);
        assertThat(repository.findById(timer.getId()).orElseThrow().getStatus()).isEqualTo(RestTimerStatus.COMPLETED);
    }
}
