package com.example.app.service;

import com.example.app.dto.AssignTicketRequest;
import com.example.app.dto.AttachmentResponse;
import com.example.app.dto.TicketAttachmentDownload;
import com.example.app.dto.TicketRequest;
import com.example.app.dto.TicketResponse;
import com.example.app.dto.WithdrawTicketRequest;
import com.example.app.dto.UpdateRequest;
import com.example.app.entity.Attachment;
import com.example.app.entity.Category;
import com.example.app.entity.SubCategory;
import com.example.app.entity.Ticket;
import com.example.app.entity.TicketUpdate;
import com.example.app.entity.UserAccount;
import com.example.app.entity.WithdrawnTicketRecord;
import com.example.app.entity.enums.Role;
import com.example.app.exception.ApiException;
import com.example.app.repository.TicketRepository;
import com.example.app.repository.WithdrawnTicketRepository;
import com.example.app.repository.CategoryRepository;
import com.example.app.repository.SubCategoryRepository;
import com.example.app.repository.UserAccountRepository;
import com.example.app.security.AuthenticatedUser;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class TicketServiceImpl implements TicketService {

    private static final int MAX_ATTACHMENTS_PER_TICKET = 3;

    private static final Set<String> ALLOWED_WITHDRAWAL_REASONS = Set.of(
            "RESOLVED_MYSELF", "NO_LONGER_NEEDED", "DUPLICATE", "ELSEWHERE", "OTHER");
    private static final int MAX_OTHER_WITHDRAWAL_REASON_LEN = 2000;

    @Autowired
    private TicketRepository ticketRepo;

    @Autowired
    private WithdrawnTicketRepository withdrawnTicketRepo;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private SubCategoryRepository subCategoryRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

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
        List<Ticket> list;
        Role role = user.getRole();
        if (role == Role.USER) {
            list = ticketRepo.findByCreatedByUserIdOrderByCreatedAtDesc(user.getUserId());
        } else if (role == Role.TECHNICIAN) {
            list = ticketRepo.findByAssignedTechnicianUserIdOrderByCreatedAtDesc(user.getUserId());
        } else if (role == Role.ADMIN) {
            list = ticketRepo.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        } else {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tickets are not available for this account role.");
        }
        Set<String> userIds = list.stream()
                .flatMap(t -> Stream.of(t.getCreatedByUserId(), t.getAssignedTechnicianUserId()))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<String, UserAccount> usersById = userIds.isEmpty()
                ? Map.of()
                : userAccountRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(UserAccount::getId, Function.identity()));
        return list.stream().map(t -> mapToResponse(t, usersById)).collect(Collectors.toList());
    }

    @Override
    public TicketResponse assignTechnician(String ticketId, AssignTicketRequest request) {
        assertRoleAdmin();
        if (request == null || request.getTechnicianUserId() == null || request.getTechnicianUserId().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Technician is required.");
        }
        Ticket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        String techId = request.getTechnicianUserId().trim();
        UserAccount tech = userAccountRepository.findById(techId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Technician account not found."));
        if (tech.getRole() != Role.TECHNICIAN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selected user is not a technician.");
        }
        String status = ticket.getStatus() != null ? ticket.getStatus().trim().toUpperCase() : "OPEN";
        if ("RESOLVED".equals(status)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This ticket can no longer be assigned.");
        }
        ticket.setAssignedTechnicianUserId(techId);
        if ("OPEN".equals(status) || "WITHDRAWN".equals(status)) {
            ticket.setStatus("IN_PROGRESS");
        }
        Ticket saved = ticketRepo.save(ticket);
        return mapToResponse(saved);
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
    public TicketResponse updateMyTicket(String id, TicketRequest request) {
        Ticket ticket = ticketRepo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertCanViewTicket(ticket);
        assertTicketSubmitter(ticket);
        assertTicketOwnerMutable(ticket);

        validateCategoryCombination(request.getCategoryId(), request.getSubCategoryId());

        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setCategoryId(request.getCategoryId());
        ticket.setSubCategoryId(request.getSubCategoryId());
        ticket.setSuggestions(request.getSuggestions() != null ? request.getSuggestions() : new ArrayList<>());

        Ticket saved = ticketRepo.save(ticket);
        return mapToResponse(saved);
    }

    @Override
    public TicketResponse withdrawMyTicket(String id, WithdrawTicketRequest request) {
        if (request == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Withdrawal reason is required.");
        }
        String raw = request.getReason();
        if (raw == null || raw.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Withdrawal reason is required.");
        }
        String code = raw.trim().toUpperCase().replace(' ', '_');
        if (!ALLOWED_WITHDRAWAL_REASONS.contains(code)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid withdrawal reason.");
        }
        String note = null;
        if ("OTHER".equals(code)) {
            String other = request.getOtherReason() != null ? request.getOtherReason().trim() : "";
            if (other.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Please describe your reason when selecting Other.");
            }
            if (other.length() > MAX_OTHER_WITHDRAWAL_REASON_LEN) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Reason is too long.");
            }
            note = other;
        }

        Ticket ticket = ticketRepo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertCanViewTicket(ticket);
        assertTicketSubmitter(ticket);
        assertTicketOwnerMutable(ticket);

        ticket.setStatus("WITHDRAWN");
        ticket.setWithdrawalReasonCode(code);
        ticket.setWithdrawalReasonNote(note);
        Ticket saved = ticketRepo.save(ticket);

        LocalDateTime withdrawnAt = LocalDateTime.now();
        WithdrawnTicketRecord withdrawalRow = new WithdrawnTicketRecord();
        withdrawalRow.setId(UUID.randomUUID().toString());
        withdrawalRow.setTicketId(saved.getId());
        withdrawalRow.setTitle(saved.getTitle());
        withdrawalRow.setWithdrawnByUserId(saved.getCreatedByUserId());
        withdrawalRow.setWithdrawnAt(withdrawnAt);
        withdrawalRow.setWithdrawalReasonCode(code);
        withdrawalRow.setWithdrawalReasonNote(note);
        withdrawnTicketRepo.save(withdrawalRow);

        return mapToResponse(saved);
    }

    @Override
    public void uploadAttachment(String id, MultipartFile file) {

        Ticket ticket = ticketRepo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertCanViewTicket(ticket);

        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Attachment file is required.");
        }

        // Always use a mutable list — Mongo mapping may return an unmodifiable list.
        ensureMutableAttachmentList(ticket);
        if (ticket.getAttachments().size() >= MAX_ATTACHMENTS_PER_TICKET) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A ticket can have at most 3 attachments.");
        }

        try {
            String originalName = file.getOriginalFilename();
            String safeFileName = originalName == null ? "attachment" : Paths.get(originalName).getFileName().toString();
            String extension = "";
            int extensionIndex = safeFileName.lastIndexOf('.');
            if (extensionIndex >= 0) {
                extension = safeFileName.substring(extensionIndex);
                safeFileName = safeFileName.substring(0, extensionIndex);
            }
            safeFileName = safeFileName.replaceAll("[^a-zA-Z0-9._-]", "_");
            if (safeFileName.isBlank()) {
                safeFileName = "attachment";
            }

            Path uploadDir = Paths.get("uploads").toAbsolutePath().normalize();
            Files.createDirectories(uploadDir);

            String storedFileName = UUID.randomUUID() + "-" + safeFileName + extension;
            Path destination = uploadDir.resolve(storedFileName);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            Attachment attachment = new Attachment();
            attachment.setId(UUID.randomUUID().toString());
            attachment.setFileName(originalName != null && !originalName.isBlank() ? originalName : storedFileName);
            attachment.setFilePath(destination.toString());

            ticket.getAttachments().add(attachment);
            ticketRepo.save(ticket);

        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "File upload failed.");
        }
    }

    @Override
    public TicketResponse deleteAttachment(String ticketId, String attachmentId) {
        Ticket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertCanModifyAttachments(ticket);

        List<Attachment> list = ticket.getAttachments();
        if (list == null || list.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Attachment not found");
        }

        Attachment found = null;
        for (Attachment a : list) {
            if (attachmentId != null && attachmentId.equals(a.getId())) {
                found = a;
                break;
            }
        }
        if (found == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Attachment not found");
        }

        List<Attachment> replacement = new ArrayList<>(list);
        replacement.removeIf(a -> attachmentId != null && attachmentId.equals(a.getId()));
        ticket.setAttachments(replacement);

        if (found.getFilePath() != null) {
            try {
                Files.deleteIfExists(Paths.get(found.getFilePath()));
            } catch (IOException ignored) {
                // still persist removal
            }
        }

        Ticket saved = ticketRepo.save(ticket);
        return mapToResponse(saved);
    }

    @Override
    public TicketAttachmentDownload getAttachmentDownload(String ticketId, String attachmentId) {
        Ticket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertCanViewTicket(ticket);
        List<Attachment> list = ticket.getAttachments();
        if (list == null || list.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Attachment not found");
        }
        Attachment att = list.stream()
                .filter(a -> attachmentId != null && attachmentId.equals(a.getId()))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Attachment not found"));
        Path path = Paths.get(att.getFilePath());
        if (!Files.exists(path)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Attachment file is missing.");
        }
        try {
            byte[] bytes = Files.readAllBytes(path);
            String mime = Files.probeContentType(path);
            if (mime == null || mime.isBlank()) {
                mime = "application/octet-stream";
            }
            String safeName = att.getFileName() != null ? att.getFileName() : "attachment";
            return new TicketAttachmentDownload(bytes, mime, safeName);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to read attachment.");
        }
    }

    private AuthenticatedUser requireAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }
        return user;
    }

    /** Spring Data MongoDB may map embedded lists as unmodifiable; mutations must use a new ArrayList. */
    private void ensureMutableAttachmentList(Ticket ticket) {
        List<Attachment> current = ticket.getAttachments();
        if (current == null) {
            ticket.setAttachments(new ArrayList<>());
        } else {
            ticket.setAttachments(new ArrayList<>(current));
        }
    }

    /** Submitter may modify attachments on their ticket; staff may modify attachments on any ticket they can view. */
    private void assertCanModifyAttachments(Ticket ticket) {
        assertCanViewTicket(ticket);
        assertTicketOwnerMutable(ticket);
        AuthenticatedUser user = requireAuthenticatedUser();
        if (user.getRole() == Role.USER) {
            assertTicketSubmitter(ticket);
        }
    }

    /**
     * Students may only see tickets they created; technicians only tickets assigned to them;
     * administrators may see all tickets.
     */
    private void assertCanViewTicket(Ticket ticket) {
        AuthenticatedUser user = requireAuthenticatedUser();
        if (user.getRole() == Role.USER) {
            String ownerId = ticket.getCreatedByUserId();
            if (ownerId == null || !ownerId.equals(user.getUserId())) {
                throw new ApiException(HttpStatus.NOT_FOUND, "Ticket not found");
            }
            return;
        }
        if (user.getRole() == Role.TECHNICIAN) {
            String assignedId = ticket.getAssignedTechnicianUserId();
            if (assignedId == null || !assignedId.equals(user.getUserId())) {
                throw new ApiException(HttpStatus.NOT_FOUND, "Ticket not found");
            }
        }
    }

    private void assertTicketSubmitter(Ticket ticket) {
        AuthenticatedUser user = requireAuthenticatedUser();
        String ownerId = ticket.getCreatedByUserId();
        if (ownerId == null || !ownerId.equals(user.getUserId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the person who submitted this ticket can update or withdraw it.");
        }
    }

    private void assertTicketOwnerMutable(Ticket ticket) {
        String status = ticket.getStatus() != null ? ticket.getStatus().trim().toUpperCase() : "OPEN";
        if ("RESOLVED".equals(status) || "WITHDRAWN".equals(status)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This ticket can no longer be changed.");
        }
    }

    private void assertRoleAdmin() {
        AuthenticatedUser user = requireAuthenticatedUser();
        if (user.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only administrators can assign technicians.");
        }
    }

    private TicketResponse mapToResponse(Ticket ticket) {
        return mapToResponse(ticket, null);
    }

    private TicketResponse mapToResponse(Ticket ticket, Map<String, UserAccount> usersById) {
        TicketResponse res = new TicketResponse();

        res.setId(ticket.getId());
        res.setTitle(ticket.getTitle());
        res.setDescription(ticket.getDescription());
        res.setStatus(ticket.getStatus());
        res.setCreatedAt(ticket.getCreatedAt());
        res.setCreatedByUserId(ticket.getCreatedByUserId());
        res.setCreatedByUsername(resolveUserDisplayName(ticket.getCreatedByUserId(), usersById));
        res.setAssignedTechnicianUserId(ticket.getAssignedTechnicianUserId());
        res.setAssignedTechnicianUsername(resolveUserDisplayName(ticket.getAssignedTechnicianUserId(), usersById));
        res.setCategoryId(ticket.getCategoryId());
        res.setSubCategoryId(ticket.getSubCategoryId());
        res.setSuggestions(ticket.getSuggestions());
        res.setWithdrawalReasonCode(ticket.getWithdrawalReasonCode());
        res.setWithdrawalReasonNote(ticket.getWithdrawalReasonNote());
        res.setAttachments(mapAttachments(ticket));

        return res;
    }

    private String resolveUserDisplayName(String userId, Map<String, UserAccount> usersById) {
        if (userId == null) {
            return null;
        }
        UserAccount u = null;
        if (usersById != null) {
            u = usersById.get(userId);
        }
        if (u == null) {
            u = userAccountRepository.findById(userId).orElse(null);
        }
        if (u == null) {
            return null;
        }
        String email = u.getEmail();
        if (email != null && !email.isBlank()) {
            return email;
        }
        String fullName = u.getFullName();
        return fullName != null && !fullName.isBlank() ? fullName : null;
    }

    private List<AttachmentResponse> mapAttachments(Ticket ticket) {
        if (ticket.getAttachments() == null || ticket.getAttachments().isEmpty()) {
            return new ArrayList<>();
        }
        return ticket.getAttachments().stream().map(a -> {
            AttachmentResponse r = new AttachmentResponse();
            r.setId(a.getId());
            r.setFileName(a.getFileName());
            return r;
        }).collect(Collectors.toList());
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
