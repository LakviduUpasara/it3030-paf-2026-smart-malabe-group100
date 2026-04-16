package com.example.app.service;

import com.example.app.dto.TicketRequest;
import com.example.app.dto.TicketResponse;
import com.example.app.dto.WithdrawTicketRequest;
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

    /** Submitter may update title, description, category, and subcategory while ticket is open or in progress. */
    TicketResponse updateMyTicket(String id, TicketRequest request);

    /** Submitter may withdraw (cancel) their own ticket while it is open or in progress. */
    TicketResponse withdrawMyTicket(String id, WithdrawTicketRequest request);
}