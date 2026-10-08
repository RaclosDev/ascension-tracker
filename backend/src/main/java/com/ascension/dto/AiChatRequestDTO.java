package com.ascension.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class AiChatRequestDTO {
    @NotBlank
    private String message;

    private String date;

    private Integer mealIndex;

    private List<Map<String, String>> chatHistory;

    private String base64Image;
}
