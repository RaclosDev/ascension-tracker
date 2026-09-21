package com.ascension.dto;

import lombok.*;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserSettingsDTO {
    private Double startWeight;
    private Double goalWeight;
    private Double weeklyGoal;
    private LocalDate startDate;
    private Integer kcal;
    private String macroStrategy;
    private Double customProteinPct;
    private Double customFatPct;
    private Double customCarbsPct;
    private Double customProteinGrams;
    private Double customFatGrams;
    private Double customCarbsGrams;
    private Integer age;
    private Integer heightCm;
    private String sex;
    private Double activityFactor;
    private String workoutData;
}
