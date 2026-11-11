package com.ascension.dto;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;

public final class LibraryItemDtos {
    private LibraryItemDtos() { }
    public record Item(@NotNull @Pattern(regexp = "PROGRAM|EXERCISE") String type,
                       @NotBlank @Size(max = 255) String id, boolean favorite,
                       @NotNull @Pattern(regexp = "PROGRAM|WEEK|SESSION|BLOCK|EXERCISE") String category,
                       @NotNull @Size(max = 12) List<@NotBlank @Size(max = 40) String> tags,
                       @Min(1) @Max(300) Integer minutes, @NotNull @Size(max = 120) String equipment,
                       Instant lastUsed, boolean used) { }
}
