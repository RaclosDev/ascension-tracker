package com.ascension.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "food_logs", indexes = {
    @Index(name = "idx_food_log_user_date", columnList = "user_email, log_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FoodLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "log_date", nullable = false)
    private LocalDate date;

    // We can just store the meal index (0 for breakfast, etc.)
    @Column(name = "meal_index", nullable = false)
    private int mealIndex;

    @Column(nullable = false)
    private String product;

    @Column(nullable = false)
    private double quantity; // in grams

    @Column(nullable = false)
    private double kcal;

    @Column(nullable = false)
    private double protein;

    @Column(nullable = false)
    private double carbs;

    @Column(nullable = false)
    private double fat;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "portions_json", columnDefinition = "jsonb")
    private String portionsJson;
}
