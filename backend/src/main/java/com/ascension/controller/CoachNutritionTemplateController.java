package com.ascension.controller;

import com.ascension.dto.NutritionTemplateDtos.SaveRequest;
import com.ascension.dto.NutritionTemplateDtos.Summary;
import com.ascension.dto.NutritionTemplateDtos.Template;
import com.ascension.service.NutritionTemplateService;
import com.ascension.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/coach/nutrition-templates")
@RequiredArgsConstructor
public class CoachNutritionTemplateController {
    private final NutritionTemplateService templates;

    @GetMapping
    public ResponseEntity<List<Summary>> list(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(templates.list(email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Template> get(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(templates.get(email, id));
    }

    @PostMapping
    public ResponseEntity<Template> create(@Valid @RequestBody SaveRequest request, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(templates.create(email, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Template> update(@PathVariable UUID id, @Valid @RequestBody SaveRequest request,
                                            @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(templates.update(email, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @RequestParam int expectedVersion,
                                       @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        templates.delete(email, id, expectedVersion);
        return ResponseEntity.noContent().build();
    }
}
