package com.ascension.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.quotas")
public class UserDataQuotaProperties {
    private long maxWorkouts = 3000;
    private long maxFoodLogs = 25000;
    private long maxRecipes = 500;
    private long maxCustomExercises = 500;
    private long maxWorkoutTemplates = 200;
    private long maxSavedFoods = 500;
    private long maxWeightEntries = 2000;
    private long maxStepsEntries = 2000;
}
