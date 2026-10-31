package com.ascension.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "rest_timers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestTimer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "fire_at", nullable = false)
    private Instant fireAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private RestTimerStatus status;

    @Column(name = "claim_token")
    private String claimToken;
    @Column(name = "lease_until")
    private Instant leaseUntil;
    @Column(name = "next_attempt_at")
    private Instant nextAttemptAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
