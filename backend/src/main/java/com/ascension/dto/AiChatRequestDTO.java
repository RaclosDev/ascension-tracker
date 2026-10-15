package com.ascension.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiChatRequestDTO {

    @NotBlank(message = "El mensaje no puede estar vacío")
    @Size(max = 2000, message = "El mensaje no puede superar los 2000 caracteres")
    private String message;

    private String date;

    private Integer mealIndex;

    @Valid
    @Size(max = 20, message = "El historial no puede superar los 20 mensajes")
    private List<ChatMessageDTO> chatHistory;

    @Size(max = 10_000_000, message = "La imagen codificada en base64 no puede superar los 10MB")
    private String base64Image;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatMessageDTO {

        @NotBlank(message = "El rol es obligatorio")
        @Pattern(regexp = "^(user|assistant)$", message = "El rol debe ser estrictamente 'user' o 'assistant'")
        private String role;

        @NotBlank(message = "El contenido no puede estar vacío")
        @Size(max = 2000, message = "El contenido no puede superar los 2000 caracteres")
        private String content;
    }
}
