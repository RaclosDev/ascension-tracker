package com.ascension.controller;

import com.ascension.dto.CheckinDtos.Checkin;
import com.ascension.dto.CheckinDtos.ReplyRequest;
import com.ascension.dto.CheckinDtos.Template;
import com.ascension.dto.CheckinDtos.TemplateRequest;
import com.ascension.service.CheckinService;
import com.ascension.service.CoachAccessPolicy;
import com.ascension.service.CoachAccessPolicy.Action;
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

/** The coach's side of weekly check-ins: the questions they ask and their replies. */
@RestController
@RequestMapping("/api/coach")
@RequiredArgsConstructor
public class CoachCheckinController {

    private final CoachAccessPolicy accessPolicy;
    private final CheckinService checkinService;

    @GetMapping("/checkin-template")
    public ResponseEntity<Template> template(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(checkinService.template(email));
    }

    @PutMapping("/checkin-template")
    public ResponseEntity<Template> saveTemplate(@Valid @RequestBody TemplateRequest request,
                                                 @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(checkinService.saveTemplate(email, request));
    }

    @GetMapping("/clients/{linkId}/checkins")
    public ResponseEntity<List<Checkin>> checkins(@PathVariable UUID linkId, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(checkinService.forCoach(accessPolicy.require(email, linkId, Action.VIEW_CHECKINS)));
    }

    @PutMapping("/clients/{linkId}/checkins/{checkinId}/reply")
    public ResponseEntity<Checkin> reply(@PathVariable UUID linkId, @PathVariable UUID checkinId,
                                         @Valid @RequestBody ReplyRequest request, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(checkinService.reply(accessPolicy.require(email, linkId, Action.REPLY_CHECKIN),
                checkinId, request.reply()));
    }
}
