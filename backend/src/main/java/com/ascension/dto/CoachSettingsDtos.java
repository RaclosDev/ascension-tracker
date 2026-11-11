package com.ascension.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class CoachSettingsDtos {
    private CoachSettingsDtos() { }

    public record Settings(@NotBlank @Size(max = 80) String displayName,
                           @NotNull @Size(max = 500) String presentation, boolean showAccountPhoto,
                           @Valid @NotNull CoachSetupDtos.Services services, boolean prefill,
                           @Valid @NotNull CoachScheduleDtos.Schedule review,
                           @NotNull @Min(0) Integer version) {
        @JsonIgnore
        @AssertTrue(message = "Las nuevas incorporaciones empiezan con seguimiento activo")
        public boolean isReviewActive() {
            return review != null && !review.paused();
        }
    }
}
