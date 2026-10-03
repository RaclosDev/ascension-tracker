package com.ascension.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class AiApplyRequestDTO {
    @NotBlank
    private String date;

    private Integer mealIndex;

    @NotEmpty
    private List<Map<String, Object>> foods;
}
