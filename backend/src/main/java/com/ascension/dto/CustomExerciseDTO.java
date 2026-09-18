package com.ascension.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CustomExerciseDTO {
    private String id;
    private String name;
    private String muscle;
    private String equipment;
    private String userEmail;
}
