package com.ascension.controller;

import com.ascension.dto.CheckinDtos.Checkin;
import com.ascension.dto.CheckinDtos.CheckinRequest;
import com.ascension.dto.CheckinDtos.ClientCheckin;
import com.ascension.dto.CoachDtos.AccessLogEntry;
import com.ascension.dto.CoachDtos.InvitationPreview;
import com.ascension.dto.CoachDtos.MyCoach;
import com.ascension.dto.CoachDtos.Permissions;
import com.ascension.dto.CoachDtos.WorkoutComment;
import com.ascension.dto.NutritionPlanDtos.NutritionPlan;
import com.ascension.dto.ProgramDtos.TodayPlan;
import com.ascension.exception.InvalidInputException;
import com.ascension.service.CheckinNotifier;
import com.ascension.service.CheckinService;
import com.ascension.service.ClientProgramService;
import com.ascension.service.CoachSessionService;
import com.ascension.service.CoachService;
import com.ascension.service.NutritionPlanService;
import com.ascension.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** The client's side of coaching: accepting an invitation, choosing what to share, and leaving. */
@RestController
@RequestMapping("/api/coaching")
@RequiredArgsConstructor
public class CoachingController {

    private final CoachService coachService;
    private final ClientProgramService clientProgramService;
    private final CoachSessionService sessionService;
    private final NutritionPlanService nutritionPlanService;
    private final CheckinService checkinService;
    private final CheckinNotifier checkinNotifier;

    /**
     * What each active program prescribes on {@code date}: the client's local day, since the server's
     * may differ near midnight. Defaults to the server's today.
     */
    @GetMapping("/today")
    public ResponseEntity<List<TodayPlan>> today(@RequestParam(required = false)
                                                 @org.springframework.format.annotation.DateTimeFormat(
                                                         iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE)
                                                 LocalDate date,
                                                 @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        LocalDate serverToday = LocalDate.now();
        LocalDate day = date == null ? serverToday : date;
        if (day.isBefore(serverToday.minusDays(2)) || day.isAfter(serverToday.plusDays(2))) {
            throw new InvalidInputException("La fecha debe ser la de hoy");
        }
        return ResponseEntity.ok(clientProgramService.today(email, day));
    }

    /** The nutrition targets a coach sets for this user, while in force; 204 when there are none. */
    @GetMapping("/nutrition-plan")
    public ResponseEntity<NutritionPlan> nutritionPlan(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return nutritionPlanService.inForce(email)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/programs/{assignmentId}/end")
    public ResponseEntity<Void> endProgram(@PathVariable UUID assignmentId, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        clientProgramService.end(email, assignmentId);
        return ResponseEntity.noContent().build();
    }

    /** What the client's coaches said about one of the client's own workouts. */
    @GetMapping("/workouts/{workoutId}/comments")
    public ResponseEntity<List<WorkoutComment>> workoutComments(@PathVariable String workoutId,
                                                                @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(sessionService.commentsFor(email, workoutId));
    }

    @GetMapping("/invitations/{token}")
    public ResponseEntity<InvitationPreview> preview(@PathVariable String token, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(coachService.previewInvitation(email, token));
    }

    @PostMapping("/invitations/{token}/accept")
    public ResponseEntity<MyCoach> accept(@PathVariable String token, @RequestBody Permissions permissions,
                                          @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(coachService.acceptInvitation(email, token, permissions));
    }

    @GetMapping("/coaches")
    public ResponseEntity<List<MyCoach>> coaches(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(coachService.listMyCoaches(email));
    }

    @PatchMapping("/coaches/{linkId}")
    public ResponseEntity<Void> updatePermissions(@PathVariable UUID linkId, @RequestBody Permissions permissions,
                                                  @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        coachService.updatePermissions(email, linkId, permissions);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/coaches/{linkId}/end")
    public ResponseEntity<Void> end(@PathVariable UUID linkId, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        coachService.endLinkAsClient(email, linkId);
        return ResponseEntity.noContent().build();
    }

    /** This week's questions from this coach and what was already sent. */
    @GetMapping("/coaches/{linkId}/checkin")
    public ResponseEntity<ClientCheckin> checkin(@PathVariable UUID linkId, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(checkinService.current(email, linkId, java.time.Instant.now()));
    }

    /** Sends this week's check-in, or changes it while the coach has not replied. */
    @PutMapping("/coaches/{linkId}/checkin")
    public ResponseEntity<Checkin> sendCheckin(@PathVariable UUID linkId, @Valid @RequestBody CheckinRequest request,
                                               @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Checkin sent = checkinService.submit(email, linkId, request, java.time.Instant.now());
        checkinNotifier.submitted(linkId, sent);
        return ResponseEntity.ok(sent);
    }

    @GetMapping("/coaches/{linkId}/checkins")
    public ResponseEntity<List<Checkin>> checkins(@PathVariable UUID linkId, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(checkinService.history(email, linkId));
    }

    @GetMapping("/access-log")
    public ResponseEntity<List<AccessLogEntry>> accessLog(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(coachService.accessLog(email));
    }
}
