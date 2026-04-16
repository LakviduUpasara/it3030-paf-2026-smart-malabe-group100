package com.example.app.service;

import com.example.app.dto.TicketRequest;
import com.example.app.dto.TicketResponse;
import com.example.app.dto.UpdateRequest;
import com.example.app.entity.Attachment;
import com.example.app.entity.Category;
import com.example.app.entity.SubCategory;
import com.example.app.entity.Ticket;
import com.example.app.entity.TicketUpdate;
import com.example.app.entity.enums.Role;
import com.example.app.exception.ApiException;
import com.example.app.repository.TicketRepository;
import com.example.app.repository.CategoryRepository;
import com.example.app.repository.SubCategoryRepository;
import com.example.app.security.AuthenticatedUser;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TicketServiceImpl implements TicketService {

    @Autowired
    private TicketRepository ticketRepo;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private SubCategoryRepository subCategoryRepository;

    @Override
    public TicketResponse createTicket(TicketRequest request) {

        Ticket ticket = new Ticket();
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setCategoryId(request.getCategoryId());
        ticket.setSubCategoryId(request.getSubCategoryId());
        ticket.setSuggestions(request.getSuggestions());
        ticket.setStatus("OPEN");
        ticket.setCreatedAt(LocalDateTime.now());
        AuthenticatedUser user = requireAuthenticatedUser();
        ticket.setCreatedByUserId(user.getUserId());

        validateCategoryCombination(request.getCategoryId(), request.getSubCategoryId());

        Ticket saved = ticketRepo.save(ticket);

        return mapToResponse(saved);
    }

    @Override
    public List<TicketResponse> getAllTickets() {
        AuthenticatedUser user = requireAuthenticatedUser();
        List<Ticket> list =
                user.getRole() == Role.USER
                        ? ticketRepo.findByCreatedByUserIdOrderByCreatedAtDesc(user.getUserId())
                        : ticketRepo.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public TicketResponse getTicketById(String id) {

        Ticket ticket = ticketRepo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertCanViewTicket(ticket);

        return mapToResponse(ticket);
    }

    @Override
    public void updateTicketStatus(String id, String status) {

        Ticket ticket = ticketRepo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertCanViewTicket(ticket);

        ticket.setStatus(status);
        ticketRepo.save(ticket);
    }

    @Override
    public void addUpdateToTicket(String id, UpdateRequest request) {

        Ticket ticket = ticketRepo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertCanViewTicket(ticket);

        TicketUpdate update = new TicketUpdate();
        update.setId(UUID.randomUUID().toString());
        update.setMessage(request.getMessage());
        update.setUpdatedBy(request.getUpdatedBy());
        update.setTimestamp(LocalDateTime.now());

        ticket.getUpdates().add(update);
        ticketRepo.save(ticket);
    }

    @Override
    public void uploadAttachment(String id, MultipartFile file) {

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
            attachment.setId(UUID.randomUUID().toString());
            attachment.setFileName(file.getOriginalFilename());
            attachment.setFilePath(filePath);

            ticket.getAttachments().add(attachment);
            ticketRepo.save(ticket);

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

    private TicketResponse mapToResponse(Ticket ticket) {
        TicketResponse res = new TicketResponse();

        res.setId(ticket.getId());
        res.setTitle(ticket.getTitle());
        res.setDescription(ticket.getDescription());
        res.setStatus(ticket.getStatus());
        res.setCreatedAt(ticket.getCreatedAt());
        res.setCreatedByUserId(ticket.getCreatedByUserId());
        res.setCategoryId(ticket.getCategoryId());
        res.setSubCategoryId(ticket.getSubCategoryId());
        res.setSuggestions(ticket.getSuggestions());

        return res;
    }

    private void validateCategoryCombination(String categoryId, String subCategoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Selected category does not exist."));
        SubCategory subCategory = subCategoryRepository.findById(subCategoryId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Selected subcategory does not exist."));
        if (!category.getId().equals(subCategory.getCategoryId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Subcategory does not belong to selected category.");
        }
    }
}
