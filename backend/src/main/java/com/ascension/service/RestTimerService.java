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

    @Transactional
    public RestTimer scheduleTimer(String userEmail, int delaySec) {
        return scheduleTimerAt(userEmail, Instant.now().plusSeconds(delaySec));
    }

    @Transactional
    public RestTimer scheduleTimerAt(String userEmail, Instant fireAt) {
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
        return restTimerRepository.cancelPendingTimers(userEmail, RestTimerStatus.PENDING, RestTimerStatus.CANCELLED);
    }

    @Transactional
    public List<RestTimer> claimDueTimers(Instant now, int limit) {
        List<RestTimer> due = restTimerRepository.findDueTimersForUpdateSkipLocked(now, limit);
        if (due.isEmpty()) {
            return Collections.emptyList();
        }
        for (RestTimer timer : due) {
            timer.setStatus(RestTimerStatus.COMPLETED);
        }
        restTimerRepository.saveAll(due);
        return due;
    }

    @Transactional
    public int purgeOldTimers(Instant cutoff) {
        int deleted = restTimerRepository.deleteTimersOlderThan(cutoff);
        if (deleted > 0) {
            log.info("Purged {} expired rest timers older than {}", deleted, cutoff);
        }
        return deleted;
    }
}
