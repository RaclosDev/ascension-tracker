package com.ascension.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutExerciseDTO {
    private String id;
    
    @NotBlank(message = "El id del ejercicio no puede estar vacio")
    @jakarta.validation.constraints.Size(max = 255)
    private String exerciseId;
    
    @jakarta.validation.constraints.Size(max = 2000, message = "Las notas son demasiado largas")
    private String notes;
    @jakarta.validation.constraints.Size(max = 2048)
    @jakarta.validation.constraints.Pattern(regexp = "^$|^https://[^\\s]+$", message = "El vídeo debe ser un enlace HTTPS")
    private String videoUrl;
    @jakarta.validation.constraints.Min(1) @jakarta.validation.constraints.Max(100)
    private Integer videoSet;
    @jakarta.validation.constraints.Min(0) @jakarta.validation.constraints.Max(7200)
    private Integer videoSeconds;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @jakarta.validation.constraints.AssertTrue(message = "El enlace del vídeo no es válido")
    public boolean isVideoUrlValid() {
        if (videoUrl == null || videoUrl.isBlank()) return true;
        try {
            var uri = java.net.URI.create(videoUrl);
            return "https".equals(uri.getScheme()) && uri.getHost() != null && uri.getUserInfo() == null;
        } catch (IllegalArgumentException error) { return false; }
    }
    
    @jakarta.validation.constraints.Size(max = 255)
    private String supersetId;
    private VariantDTO variant;
    @jakarta.validation.Valid
    @jakarta.validation.constraints.Size(max = 100, message = "No se permiten más de 100 series por ejercicio")
    private List<WorkoutSetDTO> sets;
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class VariantDTO {
        private String grip;
        private String machine;
    }
}
