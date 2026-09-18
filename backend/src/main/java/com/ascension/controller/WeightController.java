package com.ascension.controller;

import com.ascension.dto.DashboardDTO;
import com.ascension.dto.WeekSummaryDTO;
import com.ascension.dto.WeightEntryDTO;
import com.ascension.service.WeightService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

@RestController
@RequestMapping("/api/weights")
@RequiredArgsConstructor
public class WeightController {

    private final WeightService weightService;

    @GetMapping
    public ResponseEntity<List<WeightEntryDTO>> getAllWeights(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(weightService.getAllEntries(jwt.getClaimAsString("email")));
    }

    @PostMapping
    public ResponseEntity<WeightEntryDTO> saveWeight(@RequestBody WeightEntryDTO dto, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(weightService.saveEntry(jwt.getClaimAsString("email"), dto));
    }

    @DeleteMapping("/{date}")
    public ResponseEntity<Void> deleteWeight(@PathVariable LocalDate date, @AuthenticationPrincipal Jwt jwt) {
        weightService.deleteEntry(jwt.getClaimAsString("email"), date);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDTO> getDashboard(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(weightService.getDashboard(jwt.getClaimAsString("email")));
    }

    @GetMapping("/weekly")
    public ResponseEntity<List<WeekSummaryDTO>> getWeeklySummaries(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(weightService.getWeeklySummaries(jwt.getClaimAsString("email")));
    }
}
