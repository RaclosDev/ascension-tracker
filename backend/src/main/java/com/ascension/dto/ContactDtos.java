package com.ascension.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

/** A user asking about plans: paying for one, a custom plan, or anything else. */
public final class ContactDtos {

    private ContactDtos() {
    }

    public record NewContactRequest(
            @NotNull @Pattern(regexp = "PLAN|CUSTOM|OTHER") String topic,
            @NotBlank @Size(max = 2000) String message,
            @Min(1) @Max(10000) Integer desiredClients) {
    }

    public record ContactRequestExport(String topic, String message, Integer desiredClients,
                                       Instant createdAt, Instant handledAt) {
    }

    public record AdminContactRequest(UUID id, String name, String email, String topic, String message,
                                      Integer desiredClients, Instant createdAt, Instant handledAt) {
    }
}
