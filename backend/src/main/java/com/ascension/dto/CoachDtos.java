package com.ascension.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Request and response shapes for coach mode, shared by the coach and the client side. */
public final class CoachDtos {

    private CoachDtos() {
    }

    /** What the client lets a coach see. */
    public record Permissions(boolean training, boolean nutrition, boolean body) {
        public boolean any() {
            return training || nutrition || body;
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
                                 List<AccessExport> accessesToMyData, List<AccessExport> myAccessesAsCoach) {
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
