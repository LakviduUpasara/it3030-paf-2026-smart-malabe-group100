package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import java.util.HashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Health check endpoint for the Smart Campus Backend API.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    /**
     * Get system health status.
     */
    @GetMapping
    public ApiResponse<Map<String, String>> health() {
        Map<String, String> healthData = new HashMap<>();
        healthData.put("status", "UP");
        healthData.put("service", "Smart Campus Backend");
        healthData.put("version", "1.0.0");
        
        return ApiResponse.success("Service is healthy", healthData);
    }
}

