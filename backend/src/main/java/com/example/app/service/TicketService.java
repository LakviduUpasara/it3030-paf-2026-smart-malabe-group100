package com.example.app.service;

import com.example.app.dto.TicketRequest;
import com.example.app.dto.TicketResponse;
import com.example.app.dto.UpdateRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface TicketService {

    // Create ticket
    TicketResponse createTicket(TicketRequest request);

    // Get all tickets
    List<TicketResponse> getAllTickets();

    // Get ticket by ID
    TicketResponse getTicketById(String id);

    // Update ticket status
    void updateTicketStatus(String id, String status);

    // Add technician update
    void addUpdateToTicket(String id, UpdateRequest request);

    // Upload attachment
    void uploadAttachment(String id, MultipartFile file);
}