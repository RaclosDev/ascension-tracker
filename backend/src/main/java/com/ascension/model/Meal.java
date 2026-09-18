package com.ascension.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "meals")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Meal {

    @Column(name = "user_email")
    private String userEmail;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String icon;

    @Column(name = "protein_pct")
    private Double proteinPct;

    @Column(name = "fixed_protein")
    private Double fixedProtein;

    @Column(name = "carbs_pct")
    private Double carbsPct;

    @Column(name = "fixed_carbs")
    private Double fixedCarbs;

    @Column(name = "fat_pct")
    private Double fatPct;

    @Column(name = "fixed_fat")
    private Double fixedFat;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "start_time", length = 5)
    private String startTime;

    @Column(name = "end_time", length = 5)
    private String endTime;

    @Column(name = "is_default")
    private Boolean isDefault;
}

