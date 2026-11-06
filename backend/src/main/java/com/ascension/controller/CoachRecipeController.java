package com.ascension.controller;

import com.ascension.dto.CoachRecipeDtos.Recipe;
import com.ascension.dto.CoachRecipeDtos.RecipeRequest;
import com.ascension.service.CoachRecipeService;
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

/** The coach's own recipe library, used to build their clients' meal plans. */
@RestController
@RequestMapping("/api/coach/recipes")
@RequiredArgsConstructor
public class CoachRecipeController {

    private final CoachRecipeService recipeService;

    @GetMapping
    public ResponseEntity<List<Recipe>> list(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(recipeService.list(email));
    }

    @PostMapping
    public ResponseEntity<Recipe> create(@Valid @RequestBody RecipeRequest request, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(recipeService.create(email, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Recipe> update(@PathVariable UUID id, @Valid @RequestBody RecipeRequest request,
                                         @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(recipeService.update(email, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        recipeService.delete(email, id);
        return ResponseEntity.noContent().build();
    }
}
