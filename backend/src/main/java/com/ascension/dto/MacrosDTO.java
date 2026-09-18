package com.ascension.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MacrosDTO {
    private Integer kcal;
    private Double protein;
    private Double carbs;
    private Double fat;
}
