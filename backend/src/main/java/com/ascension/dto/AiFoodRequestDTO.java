package com.ascension.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiFoodRequestDTO {
    @NotBlank
    private String text;
}
