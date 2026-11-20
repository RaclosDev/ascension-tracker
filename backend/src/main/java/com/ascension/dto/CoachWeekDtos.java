package com.ascension.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class CoachWeekDtos {
    private CoachWeekDtos() { }

    public record Content(@NotNull @Valid ProgramDtos.Program program,
                          @NotNull @Size(max = 4000) String privateNotes,
                          @NotNull @Pattern(regexp = "BUILD|MAINTAIN|DELOAD|TEST|COMPETE") String intent,
                          @NotNull @Size(max = 2000) String decision) { }
    public record Save(@NotNull @Valid Content content, @Min(0) int expectedVersion) { }
    public record Publish(@Min(1) int expectedVersion) { }
    /** {@code linkedFrom} is the week this one repeats, while the coach has not edited it. */
    public record Saved(UUID linkId, LocalDate weekStart, Content content, int version,
                        UUID assignmentId, Integer publishedVersion, Instant updatedAt, LocalDate linkedFrom) { }

    /** The block a coach is running with an athlete. Its last week closes with the end-of-block questions. */
    public record BlockDefinition(@NotBlank(message = "El bloque necesita un nombre") @Size(max = 80) String name,
                                  @NotNull LocalDate startWeek,
                                  @Min(value = 2, message = "Un bloque abarca de 2 a 12 semanas")
                                  @Max(value = 12, message = "Un bloque abarca de 2 a 12 semanas") int weeks) { }
    /** A run of consecutive weeks; {@code block} is null while the coach has not defined one. */
    public record Block(BlockDefinition block, List<Saved> weeks) { }
    public record WeekVersion(@NotNull LocalDate week, @Min(1) int expectedVersion) { }
    public record PublishMany(@NotNull @Size(min = 1, max = 12) List<@Valid @NotNull WeekVersion> weeks) { }
    public record Repeat(@NotNull LocalDate source, @NotNull @Size(min = 1, max = 11) List<@NotNull LocalDate> targets) { }
}
