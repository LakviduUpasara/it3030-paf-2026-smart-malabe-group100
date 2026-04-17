package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import com.example.app.dto.CampusMessageRequest;
import com.example.app.dto.CampusMessageResponse;
import com.example.app.service.CampusMessageService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
public class CampusMessageController {

    private static final Logger logger = LoggerFactory.getLogger(CampusMessageController.class);

    private final CampusMessageService campusMessageService;

    public CampusMessageController(CampusMessageService campusMessageService) {
        this.campusMessageService = campusMessageService;
    }

    /**
     * Get all campus messages.
     */
    @GetMapping
    public ApiResponse<List<CampusMessageResponse>> getAllMessages() {
        logger.info("Fetching all campus messages");
        List<CampusMessageResponse> messages = campusMessageService.getAllMessages();
        return ApiResponse.success("Messages retrieved successfully", messages);
    }

    /**
     * Create a new campus message.
     * 
     * Sample Request Body:
     * {
     *   "title": "Maintenance Notice",
     *   "content": "System will be under maintenance tomorrow from 22:00 to 23:00"
     * }
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CampusMessageResponse> createMessage(@Valid @RequestBody CampusMessageRequest request) {
        logger.info("Creating campus message: {}", request.getTitle());
        CampusMessageResponse message = campusMessageService.createMessage(request);
        logger.info("Message created successfully with ID {}", message.getId());
        return ApiResponse.success("Message created successfully", message);
    }
}

