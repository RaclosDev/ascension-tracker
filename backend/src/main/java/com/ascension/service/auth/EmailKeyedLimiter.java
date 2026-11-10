package com.ascension.service.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Counts events per email in a fixed window, in memory. Limits password attempts per account (on
 * top of the per-IP limit) and account emails per address. When full it is cleared entirely:
 * losing the counts is better than running out of memory.
 */
final class EmailKeyedLimiter {

    private static final int MAX_TRACKED = 50_000;

    private record Window(Instant start, int count) {
    }

    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final int max;
    private final Duration window;
    private final Clock clock;

    EmailKeyedLimiter(int max, Duration window, Clock clock) {
        this.max = max;
        this.window = window;
        this.clock = clock;
    }

    /** Whether {@code max} events were already counted in the current window. */
    boolean exhausted(String key) {
        Window current = windows.get(key);
        return current != null && !expired(current) && current.count() >= max;
    }

    /** Counts one event. */
    void record(String key) {
        makeRoomFor(key);
        windows.compute(key, (k, current) -> current == null || expired(current)
                ? new Window(clock.instant(), 1)
                : new Window(current.start(), current.count() + 1));
    }

    /** Counts one event if there is room left and tells whether there was. */
    boolean tryRecord(String key) {
        boolean[] allowed = {false};
        makeRoomFor(key);
        windows.compute(key, (k, current) -> {
            if (current == null || expired(current)) {
                allowed[0] = true;
                return new Window(clock.instant(), 1);
            }
            if (current.count() >= max) {
                return current;
            }
            allowed[0] = true;
            return new Window(current.start(), current.count() + 1);
        });
        return allowed[0];
    }

    void reset(String key) {
        windows.remove(key);
    }

    private void makeRoomFor(String key) {
        if (windows.size() >= MAX_TRACKED && !windows.containsKey(key)) {
            windows.clear();
        }
    }

    private boolean expired(Window current) {
        return !clock.instant().isBefore(current.start().plus(window));
    }
}
