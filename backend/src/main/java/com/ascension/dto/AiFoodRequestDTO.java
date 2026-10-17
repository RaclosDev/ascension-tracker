package com.ascension.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiFoodRequestDTO {

    @NotBlank(message = "El texto no puede estar vacío")
    @Size(max = 2000, message = "El texto no puede superar los 2000 caracteres")
    private String text;
}
