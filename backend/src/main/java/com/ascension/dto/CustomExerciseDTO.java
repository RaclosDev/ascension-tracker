package com.ascension.dto;

import lombok.*;
import jakarta.validation.constraints.NotBlank;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CustomExerciseDTO {
    private String id;
    
    @NotBlank(message = "El nombre del ejercicio es obligatorio")
    private String name;
    
    @NotBlank(message = "El musculo objetivo es obligatorio")
    private String muscle;
    
    private String equipment;
    private String userEmail;
}
