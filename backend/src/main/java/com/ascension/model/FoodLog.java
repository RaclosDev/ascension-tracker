package com.ascension.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "food_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FoodLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", nullable = false, columnDefinition = "varchar(255) default 'raclosdev@gmail.com'")
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

    @Column(name = "portions_json", columnDefinition = "TEXT")
    private String portionsJson;
}
