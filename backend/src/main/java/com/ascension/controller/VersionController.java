package com.ascension.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/version")
public class VersionController {

    private final long startupTime = System.currentTimeMillis();

    @GetMapping
    public ResponseEntity<Map<String, Long>> getVersion() {
        return ResponseEntity.ok(Map.of("version", startupTime));
    }
}
