package com.ascension.controller;

import com.ascension.dto.RecipeDTO;
import com.ascension.service.RecipeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/nutrition/recipes")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;

    @GetMapping
    public ResponseEntity<List<RecipeDTO>> getRecipes(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(recipeService.getRecipes(jwt.getClaimAsString("email")));
    }

    @PostMapping
    public ResponseEntity<RecipeDTO> addRecipe(@Valid @RequestBody RecipeDTO dto, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(recipeService.addRecipe(jwt.getClaimAsString("email"), dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecipeDTO> updateRecipe(@PathVariable Long id, @Valid @RequestBody RecipeDTO dto, @AuthenticationPrincipal Jwt jwt) {
        dto.setId(id);
        return ResponseEntity.ok(recipeService.updateRecipe(jwt.getClaimAsString("email"), dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecipe(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        recipeService.deleteRecipe(jwt.getClaimAsString("email"), id);
        return ResponseEntity.ok().build();
    }
}
