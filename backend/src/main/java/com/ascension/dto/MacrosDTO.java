package com.ascension.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MacrosDTO {
    private Integer kcal;
    private Double protein;
    private Double carbs;
    private Double fat;
    /** Set when a coach's plan gives these targets: who set them, and TRAINING or REST. */
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    private String coachName;
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    private String dayType;
}
