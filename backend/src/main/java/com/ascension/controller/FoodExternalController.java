package com.ascension.controller;

import com.ascension.service.FoodExternalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/food-external")
public class FoodExternalController {

    private final FoodExternalService foodExternalService;

    @Autowired
    public FoodExternalController(FoodExternalService foodExternalService) {
        this.foodExternalService = foodExternalService;
    }

    @GetMapping(value = "/search", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> search(@RequestParam String q) {
        String result = foodExternalService.searchOpenFoodFacts(q);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(result);
    }

    @GetMapping(value = "/barcode", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> searchBarcode(@RequestParam String code) {
        String result = foodExternalService.searchBarcode(code);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(result);
    }
}
