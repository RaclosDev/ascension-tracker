package com.ascension.controller;

import com.ascension.dto.NutritionPlanDtos.AdherenceWeek;
import com.ascension.dto.NutritionPlanDtos.NutritionPlan;
import com.ascension.dto.NutritionPlanDtos.PlanRequest;
import com.ascension.dto.NutritionPlanDtos.PublishRequest;
import com.ascension.dto.NutritionPlanDtos.PlanVersion;
import com.ascension.service.CoachAccessPolicy;
import com.ascension.service.CoachAccessPolicy.Action;
import com.ascension.service.NutritionAdherenceService;
import com.ascension.service.NutritionPlanService;
import com.ascension.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** The nutrition targets a coach sets for one client. Setting them needs the client's edit consent. */
@RestController
@RequestMapping("/api/coach/clients/{linkId}/nutrition-plan")
@RequiredArgsConstructor
public class CoachNutritionController {

    private final CoachAccessPolicy accessPolicy;
    private final NutritionPlanService planService;
    private final NutritionAdherenceService adherenceService;

    /** The plan this coach set, while it is in force; 204 when there is none. */
    @GetMapping
    public ResponseEntity<NutritionPlan> get(@PathVariable UUID linkId, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return planService.current(accessPolicy.require(email, linkId, Action.VIEW_TARGETS))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PutMapping
    public ResponseEntity<NutritionPlan> set(@PathVariable UUID linkId, @Valid @RequestBody PlanRequest request,
                                             @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(planService.set(accessPolicy.require(email, linkId, Action.SET_NUTRITION_PLAN),
                request));
    }

    /** Logged against prescribed, per day and week, over the last {@code weeks} weeks (1 to 12). */
    @GetMapping("/adherence")
    public ResponseEntity<List<AdherenceWeek>> adherence(@PathVariable UUID linkId,
                                                         @RequestParam(defaultValue = "4") int weeks,
                                                         @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(adherenceService.weeks(accessPolicy.require(email, linkId, Action.VIEW_NUTRITION),
                Math.max(1, Math.min(12, weeks)), LocalDate.now()));
    }

    @PostMapping("/publish")
    public ResponseEntity<NutritionPlan> publish(@PathVariable UUID linkId,
                                                @Valid @RequestBody PublishRequest request,
                                                @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(planService.publish(
                accessPolicy.require(email, linkId, Action.SET_NUTRITION_PLAN), request));
    }

    @PostMapping("/{planId}/end")
    public ResponseEntity<Void> endVersion(@PathVariable UUID linkId, @PathVariable UUID planId,
                                          @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        planService.endVersion(accessPolicy.require(email, linkId, Action.SET_NUTRITION_PLAN), planId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/history")
    public ResponseEntity<List<PlanVersion>> history(@PathVariable UUID linkId, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(planService.history(accessPolicy.require(email, linkId, Action.VIEW_TARGETS)));
    }

    @GetMapping("/history/{planId}")
    public ResponseEntity<NutritionPlan> version(@PathVariable UUID linkId, @PathVariable UUID planId,
                                                @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(planService.version(accessPolicy.require(email, linkId, Action.VIEW_TARGETS), planId));
    }

    @DeleteMapping
    public ResponseEntity<Void> end(@PathVariable UUID linkId, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        planService.end(accessPolicy.require(email, linkId, Action.SET_NUTRITION_PLAN));
        return ResponseEntity.noContent().build();
    }
}
