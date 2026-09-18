package com.ascension.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Table(name = "saved_foods")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedFood {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private String name;

    private String brand;

    @Column(nullable = false)
    private double kcalPer100g;

    @Column(nullable = false)
    private double proteinPer100g;

    @Column(nullable = false)
    private double carbsPer100g;

    @Column(nullable = false)
    private double fatPer100g;

    // Serving size: grams per standard unit (e.g. 125g for a single yogurt cup)
    private Double servingSize;

    // Serving label: descriptive name (e.g. "envase", "unidad", "tarrina")
    private String servingLabel;

    @Column(name = "last_used_at")
    private java.time.LocalDateTime lastUsedAt;
}
