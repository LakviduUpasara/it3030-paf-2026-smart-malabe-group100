package com.example.app.controller;

import com.example.app.dto.TicketSuggestionRequest;
import com.example.app.dto.TicketSuggestionResponse;
import com.example.app.service.SuggestionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tickets")
@CrossOrigin
public class SuggestionController {

    @Autowired
    private SuggestionService suggestionService;

    @PostMapping("/suggestions")
    public ResponseEntity<TicketSuggestionResponse> getSuggestion(@Valid @RequestBody TicketSuggestionRequest request) {
        return ResponseEntity.ok(suggestionService.suggest(request.getDescription()));
    }
}
