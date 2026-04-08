package com.example.app.service;

import com.example.app.dto.TicketRequest;
import com.example.app.dto.TicketResponse;

import java.util.List;

public interface TicketService {

    TicketResponse createTicket(TicketRequest request);

    List<TicketResponse> getAllTickets();

    TicketResponse getTicketById(Long id);

}