package com.ascension.repository;

import com.ascension.model.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {
    Optional<PushSubscription> findByUserEmail(String userEmail);
    void deleteByUserEmail(String userEmail);
}

