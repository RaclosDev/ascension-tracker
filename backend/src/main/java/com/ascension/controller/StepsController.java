package com.ascension.controller;

import com.ascension.dto.StepsEntryDTO;
import com.ascension.dto.WeekSummaryDTO;
import com.ascension.service.StepsService;
import com.ascension.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/steps")
@RequiredArgsConstructor
public class StepsController {

    private final StepsService stepsService;

    @GetMapping
    public ResponseEntity<List<StepsEntryDTO>> getAllSteps(@AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(stepsService.getAllEntries(userEmail));
    }

    @PostMapping
    public ResponseEntity<StepsEntryDTO> saveSteps(@Valid @RequestBody StepsEntryDTO dto, @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(stepsService.saveEntry(userEmail, dto));
    }

    @DeleteMapping("/{date}")
    public ResponseEntity<Void> deleteSteps(@PathVariable LocalDate date, @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        stepsService.deleteEntry(userEmail, date);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/weekly")
    public ResponseEntity<List<WeekSummaryDTO>> getWeeklySummaries(@AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(stepsService.getWeeklySummaries(userEmail));
    }
}
