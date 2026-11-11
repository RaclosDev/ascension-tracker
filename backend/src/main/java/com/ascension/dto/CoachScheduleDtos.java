package com.ascension.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;

public final class CoachScheduleDtos {
    private CoachScheduleDtos() { }

    public record Schedule(@Min(1) @Max(7) int day, @NotNull LocalTime time,
                           @NotBlank @Size(max = 80) String timeZone, boolean paused) {
        @JsonIgnore
        @AssertTrue(message = "Elige una zona horaria válida")
        public boolean isTimeZoneValid() {
            return timeZone != null && ZoneId.getAvailableZoneIds().contains(timeZone);
        }
        @JsonIgnore
        @AssertTrue(message = "Indica una hora sin segundos")
        public boolean isTimeValid() {
            return time != null && time.getSecond() == 0 && time.getNano() == 0;
        }
    }

    public record Followup(Schedule schedule, Instant startedAt, Instant nextDueAt) { }
}
