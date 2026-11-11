package com.ascension.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public final class CoachWeekDtos {
    private CoachWeekDtos() { }

    public record Content(@NotNull @Valid ProgramDtos.Program program,
                          @NotNull @Size(max = 4000) String privateNotes,
                          @NotNull @Pattern(regexp = "BUILD|MAINTAIN|DELOAD|TEST|COMPETE") String intent,
                          @NotNull @Size(max = 2000) String decision) { }
    public record Save(@NotNull @Valid Content content, @Min(0) int expectedVersion) { }
    public record Publish(@Min(1) int expectedVersion) { }
    public record Saved(UUID linkId, LocalDate weekStart, Content content, int version,
                        UUID assignmentId, Integer publishedVersion, Instant updatedAt) { }
}
