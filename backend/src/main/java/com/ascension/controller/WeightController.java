package com.ascension.controller;

import com.ascension.dto.DashboardDTO;
import com.ascension.dto.WeekSummaryDTO;
import com.ascension.dto.WeightEntryDTO;
import com.ascension.service.WeightService;
import com.ascension.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

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
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(weightService.getAllEntries(userEmail));
    }

    @PostMapping
    public ResponseEntity<WeightEntryDTO> saveWeight(@Valid @RequestBody WeightEntryDTO dto, @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(weightService.saveEntry(userEmail, dto));
    }

    @DeleteMapping("/{date}")
    public ResponseEntity<Void> deleteWeight(@PathVariable LocalDate date, @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        weightService.deleteEntry(userEmail, date);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDTO> getDashboard(@AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(weightService.getDashboard(userEmail));
    }

    @GetMapping("/weekly")
    public ResponseEntity<List<WeekSummaryDTO>> getWeeklySummaries(@AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(weightService.getWeeklySummaries(userEmail));
    }
}
