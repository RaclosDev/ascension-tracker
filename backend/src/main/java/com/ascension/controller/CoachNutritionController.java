package com.ascension.controller;

import com.ascension.dto.NutritionPlanDtos.NutritionPlan;
import com.ascension.dto.NutritionPlanDtos.PlanRequest;
import com.ascension.service.CoachAccessPolicy;
import com.ascension.service.CoachAccessPolicy.Action;
import com.ascension.service.NutritionPlanService;
import com.ascension.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** The nutrition targets a coach sets for one client. Setting them needs the client's edit consent. */
@RestController
@RequestMapping("/api/coach/clients/{linkId}/nutrition-plan")
@RequiredArgsConstructor
public class CoachNutritionController {

    private final CoachAccessPolicy accessPolicy;
    private final NutritionPlanService planService;

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

    @DeleteMapping
    public ResponseEntity<Void> end(@PathVariable UUID linkId, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        planService.end(accessPolicy.require(email, linkId, Action.SET_NUTRITION_PLAN));
        return ResponseEntity.noContent().build();
    }
}
