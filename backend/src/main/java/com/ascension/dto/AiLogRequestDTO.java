package com.ascension.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AiLogRequestDTO {
    @NotBlank
    private String text;

    private Integer mealIndex;

    @NotNull
    private String date;

    private String base64Image;
}
