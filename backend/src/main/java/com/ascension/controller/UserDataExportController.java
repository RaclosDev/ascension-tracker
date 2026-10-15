package com.ascension.controller;

import com.ascension.dto.UserDataExportDTO;
import com.ascension.dto.UserDataRestoreSummaryDTO;
import com.ascension.service.UserDataExportService;
import com.ascension.service.UserDataRestoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserDataExportController {

    private final UserDataExportService userDataExportService;
    private final UserDataRestoreService userDataRestoreService;

    @GetMapping("/export")
    public ResponseEntity<UserDataExportDTO> exportUserData(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null || jwt.getClaimAsString("email") == null) {
            return ResponseEntity.status(401).build();
        }

        String email = jwt.getClaimAsString("email");
        UserDataExportDTO exportDTO = userDataExportService.exportUserData(email);

        String dateStr = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        String filename = "ascension-backup-" + dateStr + ".json";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_JSON)
                .body(exportDTO);
    }

    @PostMapping("/restore")
    public ResponseEntity<UserDataRestoreSummaryDTO> restoreUserData(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam com.ascension.model.RestoreMode mode,
            @RequestParam(required = false, defaultValue = "false") boolean confirmEmpty,
            @Valid @RequestBody UserDataExportDTO backup) {
        if (jwt == null || jwt.getClaimAsString("email") == null) {
            return ResponseEntity.status(401).build();
        }

        String email = jwt.getClaimAsString("email");
        UserDataRestoreSummaryDTO summary = userDataRestoreService.restoreUserData(email, mode, confirmEmpty, backup);
        return ResponseEntity.ok(summary);
    }
}
