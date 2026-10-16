package com.ascension.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.quotas")
public class UserDataQuotaProperties {
    private long maxWorkouts = 1000;
    private long maxFoodLogs = 5000;
    private long maxRecipes = 200;
    private long maxCustomExercises = 200;
    private long maxWorkoutTemplates = 100;
    private long maxSavedFoods = 500;
    private long maxWeightEntries = 2000;
    private long maxStepsEntries = 2000;
}
