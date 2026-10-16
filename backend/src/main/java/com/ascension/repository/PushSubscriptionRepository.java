package com.ascension.repository;

import com.ascension.model.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {
    List<PushSubscription> findByUserEmail(String userEmail);

    Optional<PushSubscription> findByEndpoint(String endpoint);

    @Transactional
    @Modifying
    @Query("DELETE FROM PushSubscription p WHERE p.endpoint = :endpoint")
    void deleteByEndpoint(@Param("endpoint") String endpoint);

    @Transactional
    @Modifying
    @Query("DELETE FROM PushSubscription p WHERE p.endpoint = :endpoint AND p.userEmail = :userEmail")
    void deleteByEndpointAndUserEmail(@Param("endpoint") String endpoint, @Param("userEmail") String userEmail);

    @Transactional
    @Modifying
    @Query("DELETE FROM PushSubscription p WHERE p.userEmail = :userEmail")
    void deleteByUserEmail(@Param("userEmail") String userEmail);
}

