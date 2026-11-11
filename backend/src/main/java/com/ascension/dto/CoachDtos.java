package com.ascension.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Request and response shapes for coach mode, shared by the coach and the client side. */
public final class CoachDtos {

    private CoachDtos() {
    }

    /**
     * What the client lets a coach see, plus whether the coach may prescribe training and set
     * nutrition targets. Editing only counts together with seeing that area: {@link #grantsEdit()}
     * and {@link #grantsEditNutrition()} are what get stored.
     */
    public record Permissions(boolean training, boolean nutrition, boolean body, boolean editTraining,
                              boolean editNutrition) {
        public boolean any() {
            return training || nutrition || body;
        }

        public boolean grantsEdit() {
            return training && editTraining;
        }

        public boolean grantsEditNutrition() {
            return nutrition && editNutrition;
        }
    }

    public record CoachStatus(boolean coach) {
    }

    /** The raw token is only returned once, when the invitation is created. */
    public record CreatedInvitation(UUID id, String token, Instant expiresAt) {
    }

    /**
     * Details the coach already knows about the person they invite, so that person only has to sign up and
     * accept. Every field is optional; they are kept on the invitation until it is accepted, revoked or expires.
     */
    public record InvitationProfile(
            @Pattern(regexp = "^[MF]$", message = "El sexo debe ser 'M' o 'F'") String sex,
            @Min(10) @Max(120) Integer age,
            @Min(50) @Max(300) Integer heightCm,
            @DecimalMin("1.0") @DecimalMax("1000.0") Double startWeight,
            @DecimalMin("1.0") @DecimalMax("1000.0") Double goalWeight,
            @DecimalMin("1.0") @DecimalMax("3.0") Double activityFactor,
            @Pattern(regexp = "^(TRAINING|TRAINING_NUTRITION|TRAINING_BODY|FULL)$") String appModules) {
        public boolean isEmpty() {
            return sex == null && age == null && heightCm == null && startWeight == null && goalWeight == null
                    && activityFactor == null && appModules == null;
        }
    }

    /** Optional body of a new invitation: who it is for, what the coach asks to see, and known details. */
    public record InvitationRequest(@Size(max = 80) String clientName, Permissions permissions,
                                    @Valid InvitationProfile profile, @Valid CoachSetupDtos.Setup setup) {
    }

    public record PendingInvitation(UUID id, String clientName, Permissions permissions, boolean prefilled,
                                    Instant createdAt, Instant expiresAt) {
    }

    public record Person(String name, String email, String picture) {
    }

    public record CoachClient(UUID linkId, Person client, Permissions permissions, Instant since,
                              CoachSetupDtos.Setup setup, CoachScheduleDtos.Followup followup) {
    }

    /** {@code requested} is what the coach asked for (pre-ticked); {@code profile} is null when nothing was filled in. */
    public record InvitationPreview(Person coach, Instant expiresAt, boolean alreadyLinked, String clientName,
                                    Permissions requested, InvitationProfile profile, CoachSetupDtos.Setup setup,
                                    String coachPresentation, CoachScheduleDtos.Schedule review) {
    }

    public record MyCoach(UUID linkId, Person coach, Permissions permissions, Instant since,
                          CoachScheduleDtos.Followup followup, String coachPresentation) {
    }

    /** Nutrition targets only; biometrics and workout preferences stay private to the client. */
    public record Targets(Integer kcal, String macroStrategy,
                          Double customProteinPct, Double customFatPct, Double customCarbsPct,
                          Double customProteinGrams, Double customFatGrams, Double customCarbsGrams) {
    }

    public record AccessLogEntry(Person coach, String action, LocalDate date, Instant lastAt, int hits) {
    }

    // ---- GDPR export: everything coach mode stores about the exporting user, never token hashes ----

    public record CoachingExport(Instant coachSince,
                                 com.ascension.dto.CoachSubscriptionDtos.SubscriptionExport subscription,
                                 List<LinkExport> asClient, List<LinkExport> asCoach,
                                 List<InvitationExport> invitations,
                                 List<AccessExport> accessesToMyData, List<AccessExport> myAccessesAsCoach,
                                 List<AssignmentExport> programAssignments,
                                 List<CommentExport> workoutComments,
                                 List<com.ascension.dto.NutritionPlanDtos.PlanExport> nutritionPlans,
                                 List<com.ascension.dto.CheckinDtos.CheckinExport> checkins) {
    }

    /** {@code role} is CLIENT for comments on the exporting user's workouts, COACH for comments they wrote. */
    public record CommentExport(UUID id, String role, Person other, String workoutId, String text,
                                Instant createdAt, Instant updatedAt) {
    }

    /** A coach's comment on a client's workout. */
    public record CommentRequest(
            @NotBlank(message = "Escribe un comentario")
            @Size(max = 1000, message = "El comentario no puede pasar de 1000 caracteres") String text) {
    }

    /** A comment as the client reads it on their workout. */
    public record WorkoutComment(Person coach, String text, Instant updatedAt) {
    }

    /** {@code role} is CLIENT when the program was assigned to the exporting user, COACH when they assigned it. */
    public record AssignmentExport(UUID id, String role, Person other, UUID programId, String programName,
                                   LocalDate startDate, String status, Instant createdAt, Instant endedAt) {
    }

    /** {@code other} is the coach when exported as client, and the client when exported as coach. */
    public record LinkExport(UUID linkId, Person other, String status, Permissions permissions,
                             Instant createdAt, Instant endedAt, CoachSetupDtos.Setup setup,
                             CoachScheduleDtos.Followup followup) {
    }

    public record InvitationExport(UUID id, Instant createdAt, Instant expiresAt, Instant acceptedAt,
                                   Instant revokedAt) {
    }

    public record AccessExport(Person other, String action, LocalDate date, Instant firstAt, Instant lastAt,
                               int hits) {
    }
}
