package com.example.app.controller;

import com.example.app.config.AppProperties;
import com.example.app.dto.ApiResponse;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Health check endpoint for the Smart Campus Backend API.
 */
@RestController
@RequestMapping({"/api/health", "/api/v1/health"})
@RequiredArgsConstructor
public class HealthController {

    private final AppProperties appProperties;

    /**
     * Get system health status.
     */
    @GetMapping
    public ApiResponse<Map<String, Object>> health() {
        Map<String, Object> healthData = new HashMap<>();
        healthData.put("status", "UP");
        healthData.put("service", "Smart Campus Backend");
        healthData.put("version", "1.0.0");
        healthData.put("developerMode", appProperties.isDeveloperMode());

        return ApiResponse.success("Service is healthy", healthData);
    }
}

