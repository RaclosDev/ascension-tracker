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
                   "WHERE status = 'PENDING' AND fire_at <= :now " +
                   "ORDER BY fire_at ASC LIMIT :limit " +
                   "FOR UPDATE SKIP LOCKED",
           nativeQuery = true)
    List<RestTimer> findDueTimersForUpdateSkipLocked(
            @Param("now") Instant now,
            @Param("limit") int limit
    );

    List<RestTimer> findByUserEmailAndStatus(String userEmail, RestTimerStatus status);

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE RestTimer t SET t.status = :cancelledStatus WHERE t.userEmail = :userEmail AND t.status = :pendingStatus")
    int cancelPendingTimers(
            @Param("userEmail") String userEmail,
            @Param("pendingStatus") RestTimerStatus pendingStatus,
            @Param("cancelledStatus") RestTimerStatus cancelledStatus
    );
}
