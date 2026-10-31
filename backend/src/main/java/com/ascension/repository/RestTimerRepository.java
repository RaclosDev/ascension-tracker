package com.ascension.repository;

import com.ascension.model.RestTimer;
import com.ascension.model.RestTimerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

public interface RestTimerRepository extends JpaRepository<RestTimer, Long> {

    @Query(value = "SELECT * FROM rest_timers " +
                   "WHERE ((status = 'PENDING' AND (next_attempt_at IS NULL OR next_attempt_at <= :now)) " +
                   "OR (status = 'PROCESSING' AND lease_until <= :now)) AND fire_at <= :now AND fire_at >= :minFireAt " +
                   "ORDER BY fire_at ASC LIMIT :limit " +
                   "FOR UPDATE SKIP LOCKED",
           nativeQuery = true)
    List<RestTimer> findDueTimersForUpdateSkipLocked(
            @Param("now") Instant now,
            @Param("minFireAt") Instant minFireAt,
            @Param("limit") int limit
    );

    List<RestTimer> findByUserEmailAndStatus(String userEmail, RestTimerStatus status);

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE RestTimer t SET t.status = :cancelledStatus WHERE (t.status = :pendingStatus OR t.status = com.ascension.model.RestTimerStatus.PROCESSING) AND t.fireAt < :cutoff")
    int cancelStalePendingTimers(
            @Param("cutoff") Instant cutoff,
            @Param("pendingStatus") RestTimerStatus pendingStatus,
            @Param("cancelledStatus") RestTimerStatus cancelledStatus
    );

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE RestTimer t SET t.status = :cancelledStatus WHERE t.userEmail = :userEmail AND (t.status = :pendingStatus OR t.status = com.ascension.model.RestTimerStatus.PROCESSING)")
    int cancelPendingTimers(
            @Param("userEmail") String userEmail,
            @Param("pendingStatus") RestTimerStatus pendingStatus,
            @Param("cancelledStatus") RestTimerStatus cancelledStatus
    );

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM RestTimer t WHERE t.fireAt < :cutoff")
    int deleteTimersOlderThan(@Param("cutoff") Instant cutoff);

    @Modifying
    @Query("UPDATE RestTimer t SET t.leaseUntil = :until WHERE t.id = :id AND t.claimToken = :token AND t.status = com.ascension.model.RestTimerStatus.PROCESSING AND t.leaseUntil > :now")
    int renewClaim(@Param("id") Long id, @Param("token") String token, @Param("now") Instant now, @Param("until") Instant until);

    @Modifying
    @Query("UPDATE RestTimer t SET t.status = :status, t.nextAttemptAt = :next, t.claimToken = null, t.leaseUntil = null WHERE t.id = :id AND t.claimToken = :token AND t.status = com.ascension.model.RestTimerStatus.PROCESSING")
    int finishClaim(@Param("id") Long id, @Param("token") String token, @Param("status") RestTimerStatus status, @Param("next") Instant next);
}
