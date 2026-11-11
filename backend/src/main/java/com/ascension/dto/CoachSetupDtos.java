package com.ascension.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class CoachSetupDtos {
    private CoachSetupDtos() { }

    public record Services(boolean training, boolean nutrition, boolean progress) {
        @com.fasterxml.jackson.annotation.JsonIgnore
        @AssertTrue(message = "Elige al menos un servicio")
        public boolean isSelected() {
            return training || nutrition || progress;
        }
    }

    public record Setup(@NotNull @Valid Services services,
                        @Size(max = 400) String goal,
                        @Size(max = 200) String experience,
                        @Min(1) @Max(7) Integer trainingDays,
                        @Size(max = 400) String equipment,
                        boolean reviewed) { }
}
