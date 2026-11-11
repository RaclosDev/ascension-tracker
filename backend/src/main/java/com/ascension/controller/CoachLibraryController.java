package com.ascension.controller;
import com.ascension.dto.LibraryItemDtos.Item;
import com.ascension.service.CoachLibraryService;
import com.ascension.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/coach/library-items")
public class CoachLibraryController {
    private final CoachLibraryService service;
    @GetMapping
    public ResponseEntity<List<Item>> list(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if(email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(service.list(email));
    }
    @PutMapping
    public ResponseEntity<List<Item>> save(@Valid @RequestBody Item item,@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if(email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(service.save(email,item));
    }
}
