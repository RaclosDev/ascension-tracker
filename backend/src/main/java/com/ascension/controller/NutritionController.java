package com.ascension.controller;

import com.ascension.dto.MacrosDTO;
import com.ascension.service.MacroCalculatorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ascension.util.SecurityUtils;

@Slf4j
@RestController
@RequestMapping("/api/nutrition")
@RequiredArgsConstructor
public class NutritionController {

    private final MacroCalculatorService macroCalculatorService;

    @GetMapping("/macros")
    public ResponseEntity<MacrosDTO> getMacros(@AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(macroCalculatorService.getMacros(userEmail));
    }
}
