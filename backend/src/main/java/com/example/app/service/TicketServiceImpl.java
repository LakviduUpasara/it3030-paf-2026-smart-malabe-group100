package com.example.app.service;

import com.example.app.dto.TicketRequest;
import com.example.app.dto.TicketResponse;
import com.example.app.entity.Ticket;
import com.example.app.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TicketServiceImpl implements TicketService {

    @Autowired
    private TicketRepository repo;

    @Override
    public TicketResponse createTicket(TicketRequest request) {

        Ticket ticket = new Ticket();
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setStatus("OPEN");
        ticket.setCreatedAt(LocalDateTime.now());

        Ticket saved = repo.save(ticket);

        return mapToResponse(saved);
    }

    @Override
    public List<TicketResponse> getAllTickets() {
        return repo.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public TicketResponse getTicketById(Long id) {

        Ticket ticket = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        return mapToResponse(ticket);
    }

    // 🔁 Mapping method (IMPORTANT for viva)
    private TicketResponse mapToResponse(Ticket ticket) {
        TicketResponse res = new TicketResponse();

        res.setId(ticket.getId());
        res.setTitle(ticket.getTitle());
        res.setDescription(ticket.getDescription());
        res.setStatus(ticket.getStatus());
        res.setCreatedAt(ticket.getCreatedAt());

        return res;
    }
}