package com.ascension.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Table(name = "recipes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Recipe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description; // Can contain text of ingredients

    @Column(nullable = false)
    private double totalKcal;

    @Column(nullable = false)
    private double totalProtein;

    @Column(nullable = false)
    private double totalCarbs;

    @Column(nullable = false)
    private double totalFat;
}
