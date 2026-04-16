package com.example.app.service;

import com.example.app.dto.TicketSuggestionResponse;

public interface SuggestionService {
    TicketSuggestionResponse suggest(String description);
}
