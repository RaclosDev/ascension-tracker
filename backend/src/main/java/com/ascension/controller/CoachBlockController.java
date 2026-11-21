package com.ascension.controller;

import com.ascension.dto.CoachWeekDtos.*;
import com.ascension.service.CoachWeekService;
import com.ascension.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Several weeks of one athlete at once: the block view, repeated weeks and publishing them together. */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/coach/clients/{linkId}/block")
public class CoachBlockController {
    private final CoachWeekService service;

    @GetMapping
    public ResponseEntity<Block> get(@PathVariable UUID linkId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(defaultValue = "4") int weeks, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(service.block(email, linkId, from, weeks));
    }

    @PutMapping
    public ResponseEntity<BlockDefinition> save(@PathVariable UUID linkId,
            @Valid @RequestBody BlockDefinition request, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(service.saveBlock(email, linkId, request));
    }

    @DeleteMapping
    public ResponseEntity<Void> delete(@PathVariable UUID linkId, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        service.deleteBlock(email, linkId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/publish")
    public ResponseEntity<List<Saved>> publish(@PathVariable UUID linkId,
            @Valid @RequestBody PublishMany request, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(service.publishMany(email, linkId, request));
    }

    @PostMapping("/repeat")
    public ResponseEntity<List<Saved>> repeat(@PathVariable UUID linkId,
            @Valid @RequestBody Repeat request, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(service.repeat(email, linkId, request));
    }
}
