package com.example.app.controller;

import com.example.app.dto.CampusMessageRequest;
import com.example.app.dto.CampusMessageResponse;
import com.example.app.service.CampusMessageService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/messages")
public class CampusMessageController {

    private final CampusMessageService campusMessageService;

    public CampusMessageController(CampusMessageService campusMessageService) {
        this.campusMessageService = campusMessageService;
    }

    @GetMapping
    public List<CampusMessageResponse> getAllMessages() {
        return campusMessageService.getAllMessages();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CampusMessageResponse createMessage(@Valid @RequestBody CampusMessageRequest request) {
        return campusMessageService.createMessage(request);
    }
}

