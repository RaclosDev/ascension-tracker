package com.ascension.controller;

import com.ascension.dto.RecipeDTO;
import com.ascension.service.RecipeService;
import com.ascension.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
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
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(recipeService.getRecipes(userEmail));
    }

    @PostMapping
    public ResponseEntity<RecipeDTO> addRecipe(@Valid @RequestBody RecipeDTO dto, @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(recipeService.addRecipe(userEmail, dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecipeDTO> updateRecipe(@PathVariable Long id, @Valid @RequestBody RecipeDTO dto, @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        dto.setId(id);
        return ResponseEntity.ok(recipeService.updateRecipe(userEmail, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecipe(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        recipeService.deleteRecipe(userEmail, id);
        return ResponseEntity.ok().build();
    }
}
