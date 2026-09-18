package com.ascension.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedFoodDTO {
    private Long id;
    private String name;
    private String brand;
    private double kcalPer100g;
    private double proteinPer100g;
    private double carbsPer100g;
    private double fatPer100g;
    private Double servingSize;    // grams per unit (e.g. 125 for a yogurt cup)
    private String servingLabel;   // e.g. "envase", "unidad", "tarrina"
}
