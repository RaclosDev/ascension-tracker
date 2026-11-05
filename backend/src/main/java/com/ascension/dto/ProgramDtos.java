package com.ascension.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Training programs: what a coach prescribes, day by day. */
public final class ProgramDtos {

    private ProgramDtos() {
    }

    public record ProgramSummary(UUID id, String name, int weeks, int dayCount, Instant updatedAt) {
    }

    /** Request and response body: the builder always saves the whole program at once. */
    public record Program(
            UUID id,
            @NotBlank(message = "El programa necesita un nombre") @Size(max = 120) String name,
            @Size(max = 2000) String notes,
            @NotNull @Min(1) @Max(52) Integer weeks,
            @NotNull @Size(max = 140, message = "Demasiados días en el programa") List<@Valid @NotNull Day> days,
            Instant updatedAt) {
    }

    public record Day(
            @NotNull @Min(1) @Max(52) Integer week,
            @NotNull @Min(1) @Max(7) Integer dayIndex,
            @NotBlank(message = "Cada día necesita un nombre") @Size(max = 120) String name,
            @Size(max = 2000) String notes,
            @NotNull @Size(max = 30, message = "Demasiados ejercicios en un día") List<@Valid @NotNull Exercise> exercises) {
    }

    public record Exercise(
            @NotBlank @Size(max = 255) String exerciseId,
            @Size(max = 255) String exerciseName,
            @Size(max = 255) String variantGrip,
            @Size(max = 255) String variantMachine,
            @NotNull @Min(1) @Max(20) Integer sets,
            @Min(1) @Max(100) Integer repsMin,
            @Min(1) @Max(100) Integer repsMax,
            @DecimalMin("1.0") @DecimalMax("10.0") BigDecimal targetRpe,
            @Min(0) @Max(10) Integer targetRir,
            @Min(0) @Max(900) Integer restSeconds,
            @Size(max = 60) String loadHint,
            @Min(1) @Max(20) Integer supersetGroup,
            @Size(max = 500) String notes) {
    }

    /** A coach assigns one of their library programs to a client, starting on {@code startDate}. */
    public record AssignRequest(
            @NotNull(message = "Elige un programa") UUID programId,
            @NotNull(message = "Elige la fecha de inicio") LocalDate startDate) {
    }

    /** A program copied to a client. {@code programId} is the client's copy; {@code sourceProgramId} the original. */
    public record Assignment(UUID id, UUID programId, UUID sourceProgramId, String programName, int weeks,
                             LocalDate startDate, String status, Instant createdAt, Instant endedAt) {
    }

    /** The prescribed day for a given date, with the program's own day id so a workout can point at it. */
    public record TodayDay(UUID id, int week, int dayIndex, String name, String notes, List<Exercise> exercises) {
    }

    /**
     * One active program as the client sees it on a date. {@code phase} is UPCOMING before the start
     * date, FINISHED after the last week and ACTIVE otherwise; {@code day} is null on a rest day.
     */
    /**
     * One prescribed day of a client's program next to what they did. {@code date} is the day's calendar
     * date; the workout fields are null until the client logs a workout for that day.
     */
    public record Session(UUID dayId, int week, int dayIndex, LocalDate date, String name, String notes,
                          List<Exercise> exercises, String workoutId, String workoutName, Long finishedAt,
                          String origin, String comment) {
    }

    public record TodayPlan(UUID assignmentId, UUID programId, String programName, String coachName,
                            LocalDate startDate, int weeks, String phase, Integer week, Integer dayIndex,
                            TodayDay day, String completedWorkoutId) {
    }
}
