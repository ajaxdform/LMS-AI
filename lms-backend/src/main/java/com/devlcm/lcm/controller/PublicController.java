package com.devlcm.lcm.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devlcm.lcm.dto.ApiResponse;
import com.devlcm.lcm.dto.UserDTO;
import com.devlcm.lcm.entity.User;
import com.devlcm.lcm.mapper.AllMapper;
import com.devlcm.lcm.service.UserService;
import com.google.firebase.auth.FirebaseAuthException;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/api/v1/public")
public class PublicController {
    private final UserService userService;
    private final AllMapper allMapper;
    @PostMapping(path = "/signup")
    @Operation(summary = "Register new user")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "User created"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "User exists")
    })
    public ResponseEntity<ApiResponse<UserDTO>> signup(
            @Valid @RequestBody UserDTO userDTO) throws FirebaseAuthException {
        // Get the Firebase UID from the security context (user already created in Firebase by frontend)
        String firebaseUid = (String) org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        User userEntity = allMapper.toUserEntity(userDTO);
        User createdUser = userService.createUser(userEntity, firebaseUid);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        allMapper.toUserDTO(createdUser),
                        "User created successfully"));
    }
}

