package com.ascension.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class ProgressPhotoDtos {

    private ProgressPhotoDtos() {
    }

    public enum Pose { FRONT, SIDE, BACK }

    /** One photo. The URL is signed and expires in minutes; ask again for a fresh one. */
    public record Photo(UUID id, Pose pose, LocalDate takenOn, String url, int sizeBytes, Instant createdAt) {
    }

    /** {@code enabled} is false while the server has no photo storage configured. */
    public record PhotoList(boolean enabled, List<Photo> photos) {
    }
}
