package com.ascension.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", nullable = false, unique = true, columnDefinition = "varchar(255) default 'raclosdev@gmail.com'")
    private String userEmail;

    @Column(name = "start_weight", nullable = false)
    private Double startWeight;

    @Column(name = "goal_weight", nullable = false)
    private Double goalWeight;

    @Column(name = "weekly_goal", nullable = false)
    private Double weeklyGoal;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private Integer kcal;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "macro_strategy", length = 20)
    private String macroStrategy;

    @Column(name = "custom_protein_pct")
    private Double customProteinPct;

    @Column(name = "custom_fat_pct")
    private Double customFatPct;

    @Column(name = "custom_carbs_pct")
    private Double customCarbsPct;

    @Column(name = "custom_protein_grams")
    private Double customProteinGrams;

    @Column(name = "custom_fat_grams")
    private Double customFatGrams;

    @Column(name = "custom_carbs_grams")
    private Double customCarbsGrams;

    @Column(name = "workout_data", columnDefinition = "TEXT")
    private String workoutData;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
