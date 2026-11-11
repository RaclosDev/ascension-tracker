package com.ascension.controller;

import com.ascension.dto.ProgramDtos.AssignRequest;
import com.ascension.dto.ProgramDtos.AdaptRequest;
import com.ascension.dto.ProgramDtos.Assignment;
import com.ascension.dto.ProgramDtos.Program;
import com.ascension.dto.ProgramDtos.Session;
import com.ascension.service.CoachAccessPolicy;
import com.ascension.service.CoachAccessPolicy.Action;
import com.ascension.service.CoachSessionService;
import com.ascension.service.ProgramAssignmentService;
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

/** Programs a coach has assigned to one client. Assigning needs the client's edit consent. */
@RestController
@RequestMapping("/api/coach/clients/{linkId}/programs")
@RequiredArgsConstructor
public class CoachAssignmentController {

    private final CoachAccessPolicy accessPolicy;
    private final ProgramAssignmentService assignmentService;
    private final CoachSessionService sessionService;

    @GetMapping
    public ResponseEntity<List<Assignment>> list(@PathVariable UUID linkId, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(assignmentService.list(accessPolicy.require(email, linkId, Action.VIEW_PROGRAMS)));
    }

    /** Each prescribed day of an assigned program next to the workout the client logged for it. */
    @GetMapping("/{assignmentId}/sessions")
    public ResponseEntity<List<Session>> sessions(@PathVariable UUID linkId, @PathVariable UUID assignmentId,
                                                  @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        var access = accessPolicy.require(email, linkId, Action.VIEW_PROGRAMS);
        return ResponseEntity.ok(sessionService.sessions(access, assignmentId));
    }

    @PostMapping
    public ResponseEntity<Assignment> assign(@PathVariable UUID linkId, @Valid @RequestBody AssignRequest request,
                                             @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        var access = accessPolicy.require(email, linkId, Action.ASSIGN_PROGRAM);
        return ResponseEntity.status(HttpStatus.CREATED).body(assignmentService.assign(access, request));
    }

    @PostMapping("/{assignmentId}/end")
    public ResponseEntity<Void> end(@PathVariable UUID linkId, @PathVariable UUID assignmentId,
                                    @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        assignmentService.end(accessPolicy.require(email, linkId, Action.ASSIGN_PROGRAM), assignmentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{assignmentId}/plan")
    public ResponseEntity<Program> plan(@PathVariable UUID linkId, @PathVariable UUID assignmentId,
                                       @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(assignmentService.plan(
                accessPolicy.require(email, linkId, Action.VIEW_PROGRAMS), assignmentId));
    }

    @PostMapping("/{assignmentId}/adapt")
    public ResponseEntity<Assignment> adapt(@PathVariable UUID linkId, @PathVariable UUID assignmentId,
                                           @Valid @RequestBody AdaptRequest request,
                                           @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(assignmentService.adapt(
                accessPolicy.require(email, linkId, Action.ASSIGN_PROGRAM), assignmentId, request));
    }
}
