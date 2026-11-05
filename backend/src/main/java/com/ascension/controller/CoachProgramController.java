package com.ascension.controller;

import com.ascension.dto.ProgramDtos.Program;
import com.ascension.dto.ProgramDtos.ProgramSummary;
import com.ascension.service.ProgramService;
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

/** The coach's own program library: build, copy and delete programs before assigning them. */
@RestController
@RequestMapping("/api/coach/programs")
@RequiredArgsConstructor
public class CoachProgramController {

    private final ProgramService programService;

    @GetMapping
    public ResponseEntity<List<ProgramSummary>> list(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(programService.listLibrary(email));
    }

    @PostMapping
    public ResponseEntity<Program> create(@Valid @RequestBody Program program, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(programService.createLibraryProgram(email, program));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Program> get(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(programService.getLibraryProgram(email, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Program> update(@PathVariable UUID id, @Valid @RequestBody Program program,
                                          @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(programService.updateLibraryProgram(email, id, program));
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<Program> duplicate(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(programService.duplicateLibraryProgram(email, id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        programService.deleteLibraryProgram(email, id);
        return ResponseEntity.noContent().build();
    }
}
