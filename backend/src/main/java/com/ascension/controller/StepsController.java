package com.ascension.controller;

import com.ascension.dto.StepsEntryDTO;
import com.ascension.dto.WeekSummaryDTO;
import com.ascension.service.StepsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/steps")
@RequiredArgsConstructor
public class StepsController {

    private final StepsService stepsService;

    @GetMapping
    public ResponseEntity<List<StepsEntryDTO>> getAllSteps(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(stepsService.getAllEntries(jwt.getClaimAsString("email")));
    }

    @PostMapping
    public ResponseEntity<StepsEntryDTO> saveSteps(@RequestBody StepsEntryDTO dto, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(stepsService.saveEntry(jwt.getClaimAsString("email"), dto));
    }

    @DeleteMapping("/{date}")
    public ResponseEntity<Void> deleteSteps(@PathVariable LocalDate date, @AuthenticationPrincipal Jwt jwt) {
        stepsService.deleteEntry(jwt.getClaimAsString("email"), date);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/weekly")
    public ResponseEntity<List<WeekSummaryDTO>> getWeeklySummaries(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(stepsService.getWeeklySummaries(jwt.getClaimAsString("email")));
    }
}
