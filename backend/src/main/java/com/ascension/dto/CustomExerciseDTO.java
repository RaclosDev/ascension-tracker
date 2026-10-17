package com.ascension.dto;

import lombok.*;
import jakarta.validation.constraints.NotBlank;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CustomExerciseDTO {
    private String id;
    
    @NotBlank(message = "El nombre del ejercicio es obligatorio")
    @jakarta.validation.constraints.Size(max = 255, message = "El nombre es demasiado largo")
    private String name;
    
    @NotBlank(message = "El musculo objetivo es obligatorio")
    @jakarta.validation.constraints.Size(max = 100, message = "El musculo es demasiado largo")
    private String muscle;
    
    @jakarta.validation.constraints.Size(max = 100, message = "El equipamiento es demasiado largo")
    private String equipment;
    private String userEmail;
}
