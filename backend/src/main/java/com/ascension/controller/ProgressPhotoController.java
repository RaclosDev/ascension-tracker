package com.ascension.controller;

import com.ascension.dto.ProgressPhotoDtos.Photo;
import com.ascension.dto.ProgressPhotoDtos.PhotoList;
import com.ascension.dto.ProgressPhotoDtos.Pose;
import com.ascension.service.ProgressPhotoService;
import com.ascension.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.UUID;

/** The client's own progress photos. */
@RestController
@RequestMapping("/api/progress-photos")
@RequiredArgsConstructor
public class ProgressPhotoController {

    private final ProgressPhotoService photoService;

    @GetMapping
    public ResponseEntity<PhotoList> list(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(photoService.list(email));
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<Photo> upload(@RequestParam("file") MultipartFile file,
                                        @RequestParam("pose") Pose pose,
                                        @RequestParam("takenOn") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate takenOn,
                                        @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(photoService.upload(email, pose, takenOn, ProgressPhotoService.read(file), LocalDate.now()));
    }

    @DeleteMapping("/{photoId}")
    public ResponseEntity<Void> delete(@PathVariable UUID photoId, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        photoService.delete(email, photoId);
        return ResponseEntity.noContent().build();
    }
}
