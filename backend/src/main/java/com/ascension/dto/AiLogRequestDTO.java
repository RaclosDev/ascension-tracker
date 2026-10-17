package com.ascension.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiLogRequestDTO {

    @NotBlank(message = "El texto no puede estar vacío")
    @Size(max = 2000, message = "El texto no puede superar los 2000 caracteres")
    private String text;

    private Integer mealIndex;

    @NotNull(message = "La fecha es obligatoria")
    private String date;

    @Size(max = 10_000_000, message = "La imagen codificada en base64 no puede superar los 10MB")
    private String base64Image;
}
