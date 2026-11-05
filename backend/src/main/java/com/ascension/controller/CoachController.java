package com.ascension.controller;

import com.ascension.dto.CoachDtos.CoachClient;
import com.ascension.dto.CoachDtos.CoachStatus;
import com.ascension.dto.CoachDtos.CreatedInvitation;
import com.ascension.dto.CoachDtos.PendingInvitation;
import com.ascension.service.CoachService;
import com.ascension.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** The coach managing their own profile, invitations and client list. */
@RestController
@RequestMapping("/api/coach")
@RequiredArgsConstructor
public class CoachController {

    private final CoachService coachService;

    @GetMapping("/profile")
    public ResponseEntity<CoachStatus> profile(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(new CoachStatus(coachService.isCoach(email)));
    }

    @PostMapping("/profile")
    public ResponseEntity<CoachStatus> activate(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        coachService.activateCoach(email);
        return ResponseEntity.ok(new CoachStatus(true));
    }

    @GetMapping("/invitations")
    public ResponseEntity<List<PendingInvitation>> invitations(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(coachService.listInvitations(email));
    }

    @PostMapping("/invitations")
    public ResponseEntity<CreatedInvitation> invite(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(coachService.createInvitation(email));
    }

    @DeleteMapping("/invitations/{id}")
    public ResponseEntity<Void> revoke(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        coachService.revokeInvitation(email, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/clients")
    public ResponseEntity<List<CoachClient>> clients(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(coachService.listClients(email));
    }

    @PostMapping("/clients/{linkId}/end")
    public ResponseEntity<Void> endClient(@PathVariable UUID linkId, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        coachService.endLinkAsCoach(email, linkId);
        return ResponseEntity.noContent().build();
    }
}
