package com.devlcm.lcm.controller;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller to expose CSRF token endpoint.
 * This helps SPAs fetch CSRF tokens before making state-changing requests.
 */
@RestController
@RequestMapping("/api/v1")
public class CsrfController {

    /**
     * Get CSRF token.
     * This endpoint returns the CSRF token to the client.
     * The token is automatically set in a cookie by Spring Security.
     * 
     * @param token The CSRF token (automatically injected by Spring)
     * @return The CSRF token details
     */
    @GetMapping("/csrf")
    public CsrfToken csrf(CsrfToken token) {
        return token;
    }
}
