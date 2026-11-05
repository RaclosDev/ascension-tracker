package com.ascension.dto;

import jakarta.validation.constraints.NotBlank;
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

    public record PendingInvitation(UUID id, Instant createdAt, Instant expiresAt) {
    }

    public record Person(String name, String email, String picture) {
    }

    public record CoachClient(UUID linkId, Person client, Permissions permissions, Instant since) {
    }

    public record InvitationPreview(Person coach, Instant expiresAt, boolean alreadyLinked) {
    }

    public record MyCoach(UUID linkId, Person coach, Permissions permissions, Instant since) {
    }

    /** Nutrition targets only; biometrics and workout preferences stay private to the client. */
    public record Targets(Integer kcal, String macroStrategy,
                          Double customProteinPct, Double customFatPct, Double customCarbsPct,
                          Double customProteinGrams, Double customFatGrams, Double customCarbsGrams) {
    }

    public record AccessLogEntry(Person coach, String action, LocalDate date, Instant lastAt, int hits) {
    }

    // ---- GDPR export: everything coach mode stores about the exporting user, never token hashes ----

    public record CoachingExport(Instant coachSince, List<LinkExport> asClient, List<LinkExport> asCoach,
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
                             Instant createdAt, Instant endedAt) {
    }

    public record InvitationExport(UUID id, Instant createdAt, Instant expiresAt, Instant acceptedAt,
                                   Instant revokedAt) {
    }

    public record AccessExport(Person other, String action, LocalDate date, Instant firstAt, Instant lastAt,
                               int hits) {
    }
}
