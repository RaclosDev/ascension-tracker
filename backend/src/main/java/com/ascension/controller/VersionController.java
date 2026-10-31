package com.ascension.controller;

import org.springframework.http.CacheControl;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/version")
public class VersionController {

    private final long startupTime = System.currentTimeMillis();

    private final String commit;

    public VersionController(@Value("${app.build.commit:${HEROKU_SLUG_COMMIT:unknown}}") String commit) {
        this.commit = commit;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getVersion() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noCache().mustRevalidate())
                .body(Map.of("version", startupTime, "commit", commit));
    }
}
