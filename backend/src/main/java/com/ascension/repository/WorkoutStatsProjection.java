package com.ascension.repository;

import java.math.BigDecimal;

public interface WorkoutStatsProjection {
    long getTotalWorkouts();
    long getTotalDurationSeconds();
    long getTotalSets();
    BigDecimal getTotalVolume();
}
