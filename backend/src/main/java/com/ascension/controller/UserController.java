package com.ascension.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AuthController authController;

    public UserController(AuthController authController) {
        this.authController = authController;
    }

    @DeleteMapping("/account")
    public ResponseEntity<Map<String, String>> deleteAccount(@AuthenticationPrincipal Jwt jwt) {
        return authController.deleteAccount(jwt);
    }
}
