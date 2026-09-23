package com.ascension.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FoodLogDTO {
    private Long id;
    private LocalDate date;
    private Integer mealIndex;
    private String product;
    private double quantity;
    private double kcal;
    private double protein;
    private double carbs;
    private double fat;
    private String portionsJson;
}
