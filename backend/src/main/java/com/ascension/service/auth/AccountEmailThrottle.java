package com.ascension.service.auth;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;

/**
 * At most one account email (sign-up code, "you already have an account", "sign in with Google",
 * reset link) per address and minute, so nobody can flood the inbox of another person.
 */
@Component
public class AccountEmailThrottle {

    static final Duration INTERVAL = Duration.ofMinutes(1);

    private final EmailKeyedLimiter limiter = new EmailKeyedLimiter(1, INTERVAL, Clock.systemUTC());

    /** Whether an email may be sent to this address now; if so, it counts as sent. */
    boolean tryAcquire(String email) {
        return limiter.tryRecord(email);
    }
}
