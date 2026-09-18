package com.ascension.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MealDTO {
    private Long id;
    private String name;
    private String icon;
    private Double proteinPct;
    private Double fixedProtein;
    private Double carbsPct;
    private Double fixedCarbs;
    private Double fatPct;
    private Double fixedFat;
    private Integer sortOrder;
    private String startTime;
    private String endTime;
    private Boolean isDefault;
}
