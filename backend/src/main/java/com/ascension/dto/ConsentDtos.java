package com.ascension.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class ConsentDtos {

    private ConsentDtos() {
    }

    public enum Kind { TERMS, PRIVACY, HEALTH_DATA, AI_HEALTH, COACH_TERMS }

    /** The latest answer for one kind of consent. */
    public record Answer(boolean granted, String version, Instant at) {
    }

    /** {@code version} is the current version of the legal texts; kinds never answered are absent. */
    public record Status(String version, Map<Kind, Answer> consents) {
    }

    public record Change(@NotNull Kind kind, boolean granted) {
    }

    public record ChangeRequest(@NotEmpty @Size(max = 8) List<@Valid @NotNull Change> consents) {
    }
}
