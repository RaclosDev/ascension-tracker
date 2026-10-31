package com.ascension.service;

import com.ascension.model.RestTimer;
import com.ascension.model.RestTimerStatus;
import com.ascension.repository.RestTimerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RestTimerService {

    private final RestTimerRepository restTimerRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;

    @Transactional
    public RestTimer scheduleTimer(String userEmail, int delaySec) {
        return scheduleTimerAt(userEmail, Instant.now().plusSeconds(delaySec));
    }

    @Transactional
    public RestTimer scheduleTimerAt(String userEmail, Instant fireAt) {
        lockUser(userEmail);
        restTimerRepository.cancelPendingTimers(userEmail, RestTimerStatus.PENDING, RestTimerStatus.CANCELLED);

        RestTimer timer = RestTimer.builder()
                .userEmail(userEmail)
                .fireAt(fireAt)
                .status(RestTimerStatus.PENDING)
                .createdAt(Instant.now())
                .build();
        return restTimerRepository.save(timer);
    }

    @Transactional
    public int cancelTimers(String userEmail) {
        lockUser(userEmail);
        return restTimerRepository.cancelPendingTimers(userEmail, RestTimerStatus.PENDING, RestTimerStatus.CANCELLED);
    }

    @Transactional
    public List<RestTimer> claimDueTimers(Instant now, int limit) {
        Instant minFireAt = now.minus(java.time.Duration.ofMinutes(15));
        restTimerRepository.cancelStalePendingTimers(minFireAt, RestTimerStatus.PENDING, RestTimerStatus.CANCELLED);
        List<RestTimer> due = restTimerRepository.findDueTimersForUpdateSkipLocked(now, minFireAt, limit);
        if (due.isEmpty()) {
            return Collections.emptyList();
        }
        for (RestTimer timer : due) {
            timer.setStatus(RestTimerStatus.PROCESSING);
            timer.setClaimToken(java.util.UUID.randomUUID().toString());
            timer.setLeaseUntil(now.plusSeconds(60));
        }
        restTimerRepository.saveAll(due);
        return due;
    }

    @Transactional
    public boolean renewClaim(RestTimer timer) {
        Instant now = Instant.now();
        if (timer.getFireAt().isBefore(now.minusSeconds(900))) return false;
        return restTimerRepository.renewClaim(timer.getId(), timer.getClaimToken(), now, now.plusSeconds(60)) == 1;
    }

    @Transactional
    public void finishDelivery(RestTimer timer, boolean delivered) {
        restTimerRepository.finishClaim(timer.getId(), timer.getClaimToken(),
                delivered ? RestTimerStatus.COMPLETED : RestTimerStatus.PENDING,
                delivered ? null : Instant.now().plusSeconds(30));
    }

    @Transactional
    public int purgeOldTimers(Instant cutoff) {
        int deleted = restTimerRepository.deleteTimersOlderThan(cutoff);
        if (deleted > 0) {
            log.info("Purged {} expired rest timers older than {}", deleted, cutoff);
        }
        return deleted;
    }
    private void lockUser(String email) {
        jdbc.queryForObject("SELECT email FROM users WHERE email = ? FOR UPDATE", String.class, email);
    }
}
