package com.example.app.service;

import com.example.app.dto.TicketRequest;
import com.example.app.dto.TicketResponse;
import com.example.app.dto.UpdateRequest;
import com.example.app.entity.Attachment;
import com.example.app.entity.Ticket;
import com.example.app.entity.TicketUpdate;
import com.example.app.entity.enums.Role;
import com.example.app.exception.ApiException;
import com.example.app.repository.AttachmentRepository;
import com.example.app.repository.TicketRepository;
import com.example.app.repository.TicketUpdateRepository;
import com.example.app.security.AuthenticatedUser;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TicketServiceImpl implements TicketService {

    @Autowired
    private TicketRepository ticketRepo;

    @Autowired
    private TicketUpdateRepository updateRepo;

    @Autowired
    private AttachmentRepository attachmentRepo;

    // ✅ CREATE TICKET
    @Override
    public TicketResponse createTicket(TicketRequest request) {

        Ticket ticket = new Ticket();
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setStatus("OPEN");
        ticket.setCreatedAt(LocalDateTime.now());
        AuthenticatedUser user = requireAuthenticatedUser();
        ticket.setCreatedByUserId(user.getUserId());

        Ticket saved = ticketRepo.save(ticket);

        return mapToResponse(saved);
    }

    // ✅ GET ALL TICKETS
    @Override
    public List<TicketResponse> getAllTickets() {
        AuthenticatedUser user = requireAuthenticatedUser();
        List<Ticket> list =
                user.getRole() == Role.USER
                        ? ticketRepo.findByCreatedByUserIdOrderByCreatedAtDesc(user.getUserId())
                        : ticketRepo.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // ✅ GET TICKET BY ID
    @Override
    public TicketResponse getTicketById(Long id) {

        Ticket ticket = ticketRepo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertCanViewTicket(ticket);

        return mapToResponse(ticket);
    }

    // ✅ UPDATE STATUS
    @Override
    public void updateTicketStatus(Long id, String status) {

        Ticket ticket = ticketRepo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertCanViewTicket(ticket);

        ticket.setStatus(status);
        ticketRepo.save(ticket);
    }

    // ✅ ADD TECHNICIAN UPDATE
    @Override
    public void addUpdateToTicket(Long id, UpdateRequest request) {

        Ticket ticket = ticketRepo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertCanViewTicket(ticket);

        TicketUpdate update = new TicketUpdate();
        update.setMessage(request.getMessage());
        update.setUpdatedBy(request.getUpdatedBy());
        update.setTimestamp(LocalDateTime.now());
        update.setTicket(ticket);

        updateRepo.save(update);
    }

    // ✅ UPLOAD ATTACHMENT
    @Override
    public void uploadAttachment(Long id, MultipartFile file) {

        Ticket ticket = ticketRepo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertCanViewTicket(ticket);

        try {
            String uploadDir = "uploads/";
            File dir = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();

            String filePath = uploadDir + file.getOriginalFilename();
            file.transferTo(new File(filePath));

            Attachment attachment = new Attachment();
            attachment.setFileName(file.getOriginalFilename());
            attachment.setFilePath(filePath);
            attachment.setTicket(ticket);

            attachmentRepo.save(attachment);

        } catch (IOException e) {
            throw new RuntimeException("File upload failed");
        }
    }

    private AuthenticatedUser requireAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }
        return user;
    }

    /**
     * Students may only see tickets they created; staff roles may see all tickets.
     */
    private void assertCanViewTicket(Ticket ticket) {
        AuthenticatedUser user = requireAuthenticatedUser();
        if (user.getRole() != Role.USER) {
            return;
        }
        String ownerId = ticket.getCreatedByUserId();
        if (ownerId == null || !ownerId.equals(user.getUserId())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Ticket not found");
        }
    }

    // 🔁 MAPPING METHOD
    private TicketResponse mapToResponse(Ticket ticket) {
        TicketResponse res = new TicketResponse();

        res.setId(ticket.getId());
        res.setTitle(ticket.getTitle());
        res.setDescription(ticket.getDescription());
        res.setStatus(ticket.getStatus());
        res.setCreatedAt(ticket.getCreatedAt());
        res.setCreatedByUserId(ticket.getCreatedByUserId());

        return res;
    }
}