package com.ascension.dto;

import com.ascension.dto.CoachDtos.Person;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Weekly check-ins: the questions a coach asks and what the client answers each week. */
public final class CheckinDtos {

    private CheckinDtos() {
    }

    /** {@code custom} is false while the coach still uses the default questions. */
    public record Template(List<String> questions, boolean custom) {
    }

    public record TemplateRequest(@NotNull @Size(max = 10) List<@NotBlank @Size(max = 200) String> questions) {
    }

    public record Answer(String question, String answer) {
    }

    /** {@code answers} follow the order of the coach's questions; missing ones are left blank. */
    public record CheckinRequest(@Min(1) @Max(5) int energy, @Min(1) @Max(5) int sleep,
                                 @Min(1) @Max(5) int trainingAdherence, @Min(1) @Max(5) int dietAdherence,
                                 @Size(max = 10) List<@Size(max = 1000) String> answers,
                                 @Size(max = 2000) String notes) {
    }

    public record ReplyRequest(@NotBlank @Size(max = 2000) String reply) {
    }

    /** {@code weightAvg} is the week's average weight, only while the client shares body data. */
    public record Checkin(UUID id, UUID linkId, LocalDate weekStart, Double weightAvg, int energy, int sleep,
                          int trainingAdherence, int dietAdherence, List<Answer> answers, String notes,
                          String coachReply, Instant repliedAt, Instant createdAt, Instant updatedAt) {
    }

    /** This week's check-in for one coach: the questions to answer and what was sent, if anything. */
    public record ClientCheckin(UUID linkId, Person coach, LocalDate weekStart, List<String> questions,
                                Checkin current) {
    }

    /** {@code role} is CLIENT for check-ins the exporting user sent, COACH for ones they received. */
    public record CheckinExport(String role, Person other, Checkin checkin) {
    }
}
