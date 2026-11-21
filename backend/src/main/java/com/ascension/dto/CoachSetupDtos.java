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
                        boolean reviewed,
                        @jakarta.validation.constraints.Pattern(regexp="GENERAL|PERFORMANCE|MAINTAIN|WEIGHT_CHANGE") String goalFocus,
                        @jakarta.validation.constraints.Pattern(regexp="RIR|RPE|NONE") String effortMethod) { }

    /** An exercise the coach does not want to prescribe to this athlete, with the reason if any. */
    public record Avoided(@jakarta.validation.constraints.NotBlank @Size(max = 80) String exerciseId,
                          @Size(max = 120) String name,
                          @Size(max = 200) String reason) { }

    /** What the coach keeps about one athlete for themselves. The athlete never receives it. */
    public record CoachNotes(@Size(max = 600) String pinnedNote,
                             @Size(max = 40) java.util.List<@NotNull @Valid Avoided> avoidedExercises) {
        public CoachNotes {
            avoidedExercises = avoidedExercises == null ? java.util.List.of() : java.util.List.copyOf(avoidedExercises);
        }
    }
}
