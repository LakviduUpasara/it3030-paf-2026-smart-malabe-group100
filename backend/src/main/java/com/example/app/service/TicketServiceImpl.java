package com.example.app.service;

import com.example.app.dto.AssignTicketRequest;
import com.example.app.dto.TechnicianRejectAssignmentRequest;
import com.example.app.dto.AttachmentResponse;
import com.example.app.dto.TicketUpdateResponse;
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
import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.NotificationCategory;
import com.example.app.entity.enums.NotificationRelatedEntity;
import com.example.app.entity.enums.NotificationType;
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
import java.util.Comparator;
import java.util.LinkedHashMap;
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
    private static final int MAX_TECHNICIAN_EVIDENCE = 3;

    private static final Set<String> ALLOWED_WITHDRAWAL_REASONS = Set.of(
            "RESOLVED_MYSELF", "NO_LONGER_NEEDED", "DUPLICATE", "ELSEWHERE", "OTHER");
    private static final int MAX_OTHER_WITHDRAWAL_REASON_LEN = 2000;

    private static final Set<String> VALID_TICKET_STATUSES = Set.of(
            "OPEN", "ASSIGNED", "IN_PROGRESS", "ACCEPTED", "REJECTED", "RESOLVED", "WITHDRAWN");

    private static final String TECH_ACCEPT_PENDING = "PENDING";
    private static final String TECH_ACCEPT_ACCEPTED = "ACCEPTED";
    private static final String TECH_ACCEPT_REJECTED = "REJECTED";

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

    @Autowired
    private NotificationService notificationService;

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

        try {
            notifyAdminsTicketCreated(saved, user);
        } catch (RuntimeException ignored) {
            // notifications must not break ticket creation
        }

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
            list = mergeTechnicianVisibleTickets(user.getUserId());
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

    /**
     * Assigned tickets plus tickets this technician declined (still visible for history until the desk reassigns).
     */
    private List<Ticket> mergeTechnicianVisibleTickets(String technicianUserId) {
        List<Ticket> assigned = ticketRepo.findByAssignedTechnicianUserIdOrderByCreatedAtDesc(technicianUserId);
        List<Ticket> rejectedByMe = ticketRepo.findByLastRejectedByTechnicianUserIdOrderByCreatedAtDesc(technicianUserId);
        List<Ticket> withdrawnFormerlyMine =
                ticketRepo.findByWithdrawalPriorTechnicianUserIdOrderByCreatedAtDesc(technicianUserId);
        Map<String, Ticket> merged = new LinkedHashMap<>();
        for (Ticket t : assigned) {
            merged.put(t.getId(), t);
        }
        for (Ticket t : rejectedByMe) {
            merged.putIfAbsent(t.getId(), t);
        }
        for (Ticket t : withdrawnFormerlyMine) {
            merged.putIfAbsent(t.getId(), t);
        }
        return merged.values().stream()
                .sorted(Comparator.comparing(Ticket::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .collect(Collectors.toList());
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
        if ("RESOLVED".equals(status) || "WITHDRAWN".equals(status)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This ticket can no longer be assigned.");
        }
        ticket.setAssignedTechnicianUserId(techId);
        ticket.setTechnicianAssignmentRejectionNote(null);
        ticket.setLastRejectedByTechnicianUserId(null);
        ticket.setStatus("IN_PROGRESS");
        ticket.setTechnicianAcceptance(TECH_ACCEPT_PENDING);
        Ticket saved = ticketRepo.save(ticket);
        try {
            notifyTicketAssigned(saved, techId, requireAuthenticatedUser().getUserId());
        } catch (RuntimeException ignored) {
        }
        return mapToResponse(saved);
    }

    @Override
    public TicketResponse acceptAssignment(String ticketId) {
        Ticket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        AuthenticatedUser user = requireAuthenticatedUser();
        if (user.getRole() != Role.TECHNICIAN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only technicians can accept assignments.");
        }
        requireAssignedTechnician(ticket, user);
        if (technicianHasAccepted(ticket)) {
            return mapToResponse(ticketRepo.findById(ticketId)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found")));
        }
        if (!technicianAwaitingAcceptance(ticket)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This ticket is not awaiting acceptance.");
        }
        ticket.setStatus("ACCEPTED");
        ticket.setTechnicianAcceptance(TECH_ACCEPT_ACCEPTED);
        ticket.setTechnicianAssignmentRejectionNote(null);
        ticketRepo.save(ticket);
        Ticket reloaded = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        try {
            notifyAssignmentAccepted(reloaded, user.getUserId());
        } catch (RuntimeException ignored) {
        }
        return mapToResponse(reloaded);
    }

    @Override
    public TicketResponse rejectAssignment(String ticketId, TechnicianRejectAssignmentRequest request) {
        if (request == null || request.getReason() == null || request.getReason().trim().length() < 3) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A reason is required (at least 3 characters).");
        }
        Ticket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        AuthenticatedUser user = requireAuthenticatedUser();
        if (user.getRole() != Role.TECHNICIAN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only technicians can reject assignments.");
        }
        requireAssignedTechnician(ticket, user);
<<<<<<< HEAD
        if (!technicianAwaitingAcceptance(ticket)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "This ticket is not awaiting acceptance. Contact the desk if you need to hand off work.");
        }
        String note = request.getReason().trim();
=======
        String from = normalizeTicketStatus(ticket.getStatus());
        if (!"ASSIGNED".equals(from) && !"IN_PROGRESS".equals(from) && !"ACCEPTED".equals(from)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Only tickets awaiting acceptance, in progress, or accepted can be returned to the queue.");
        }
        if (request == null || request.getReason() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A reason is required when declining an assignment.");
        }
        String trimmed = request.getReason().trim();
        if (trimmed.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A reason is required when declining an assignment.");
        }
        if (trimmed.length() > 500) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Reason is too long (max 500 characters).");
        }
        String note = trimmed;
>>>>>>> 03770c00c6f3d09d95419accb856f2e5a348ee34
        // Back to desk queue as OPEN so managers can reassign; history kept via technicianAcceptance + lastRejectedByTechnicianUserId.
        ticket.setStatus("OPEN");
        ticket.setAssignedTechnicianUserId(null);
        ticket.setTechnicianAcceptance(TECH_ACCEPT_REJECTED);
        ticket.setLastRejectedByTechnicianUserId(user.getUserId());
        ticket.setTechnicianAssignmentRejectionNote(note);
        ticketRepo.save(ticket);
        Ticket reloaded = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        try {
            notifyAssignmentRejected(reloaded, user.getUserId(), note);
        } catch (RuntimeException ignored) {
        }
        return mapToResponse(reloaded);
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
        AuthenticatedUser user = requireAuthenticatedUser();
        String normalized = normalizeTicketStatus(status);
        if (normalized == null || normalized.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Status is required.");
        }
        if (user.getRole() == Role.TECHNICIAN) {
            requireAssignedTechnician(ticket, user);
            assertTechnicianStatusChange(ticket, normalized);
        } else if (user.getRole() == Role.ADMIN) {
            ensureValidStatusEnum(normalized);
        } else {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only staff can update ticket status.");
        }
        String previous = normalizeTicketStatus(ticket.getStatus());
        ticket.setStatus(normalized);
        Ticket saved = ticketRepo.save(ticket);
        if (user.getRole() == Role.TECHNICIAN
                && "RESOLVED".equals(normalized)
                && !"RESOLVED".equals(previous)) {
            try {
                notifyTicketResolved(saved, user.getUserId());
            } catch (RuntimeException ignored) {
            }
        }
    }

    @Override
    public TicketResponse addUpdateToTicket(String id, UpdateRequest request) {

        Ticket ticket = ticketRepo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertTechnicianCanModifyTicketContent(ticket);

        ensureMutableUpdatesList(ticket);
        AuthenticatedUser author = requireAuthenticatedUser();

        String body = request.getMessage() != null ? request.getMessage().trim() : "";
        if (body.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Message is required.");
        }

        TicketUpdate update = new TicketUpdate();
        update.setId(UUID.randomUUID().toString());
        update.setMessage(body);
        update.setUpdatedBy(displayNameForAuthenticatedUser(author));
        update.setTimestamp(LocalDateTime.now());

        ticket.getUpdates().add(update);
        ticketRepo.save(ticket);
        Ticket reloaded = ticketRepo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        return mapToResponse(reloaded);
    }

    @Override
    public TicketResponse patchTicketUpdate(String ticketId, String updateId, UpdateRequest request) {
        Ticket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertTechnicianCanModifyTicketContent(ticket);

        ensureMutableUpdatesList(ticket);
        List<TicketUpdate> list = ticket.getUpdates();
        TicketUpdate found = null;
        for (TicketUpdate u : list) {
            if (updateId != null && updateId.equals(u.getId())) {
                found = u;
                break;
            }
        }
        if (found == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Update not found");
        }
        String body = request.getMessage() != null ? request.getMessage().trim() : "";
        if (body.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Message is required.");
        }
        found.setMessage(body);
        ticketRepo.save(ticket);
        Ticket reloaded = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        return mapToResponse(reloaded);
    }

    @Override
    public TicketResponse deleteTicketUpdate(String ticketId, String updateId) {
        Ticket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertTechnicianCanModifyTicketContent(ticket);

        ensureMutableUpdatesList(ticket);
        List<TicketUpdate> list = ticket.getUpdates();
        if (list == null || list.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Update not found");
        }
        List<TicketUpdate> replacement = new ArrayList<>(list);
        boolean removed = replacement.removeIf(u -> updateId != null && updateId.equals(u.getId()));
        if (!removed) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Update not found");
        }
        ticket.setUpdates(replacement);
        ticketRepo.save(ticket);
        Ticket reloaded = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        return mapToResponse(reloaded);
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

        String priorTechnicianUserId = ticket.getAssignedTechnicianUserId();
        ticket.setWithdrawalPriorTechnicianUserId(priorTechnicianUserId);
        ticket.setAssignedTechnicianUserId(null);
        ticket.setTechnicianAcceptance(null);

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

        try {
            notifyTicketWithdrawnByUser(saved, priorTechnicianUserId);
        } catch (RuntimeException ignored) {
        }

        return mapToResponse(saved);
    }

    @Override
    public TicketResponse uploadAttachment(String id, MultipartFile file) {

        Ticket ticket = ticketRepo.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertCanModifyRequesterAttachments(ticket);

        ensureMutableAttachmentList(ticket);
        if (ticket.getAttachments().size() >= MAX_ATTACHMENTS_PER_TICKET) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A ticket can have at most 3 requester attachments.");
        }

        Attachment attachment = persistUploadedFile(file);
        ticket.getAttachments().add(attachment);
        Ticket saved = ticketRepo.save(ticket);
        return mapToResponse(saved);
    }

    @Override
    public TicketResponse uploadTechnicianEvidence(String ticketId, MultipartFile file) {
        Ticket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertTechnicianCanModifyTicketContent(ticket);

        ensureMutableTechnicianAttachmentList(ticket);
        if (ticket.getTechnicianAttachments().size() >= MAX_TECHNICIAN_EVIDENCE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You can upload at most 3 technician evidence files.");
        }

        Attachment attachment = persistUploadedFile(file);
        ticket.getTechnicianAttachments().add(attachment);
        ticketRepo.save(ticket);
        Ticket reloaded = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        return mapToResponse(reloaded);
    }

    @Override
    public TicketResponse deleteTechnicianEvidence(String ticketId, String attachmentId) {
        Ticket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertTechnicianCanModifyTicketContent(ticket);

        ensureMutableTechnicianAttachmentList(ticket);
        List<Attachment> list = ticket.getTechnicianAttachments();
        if (list == null || list.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Evidence not found");
        }

        Attachment found = findInAttachmentList(list, attachmentId);
        if (found == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Evidence not found");
        }

        List<Attachment> replacement = new ArrayList<>(list);
        replacement.removeIf(a -> attachmentId != null && attachmentId.equals(a.getId()));
        ticket.setTechnicianAttachments(replacement);

        if (found.getFilePath() != null) {
            try {
                Files.deleteIfExists(Paths.get(found.getFilePath()));
            } catch (IOException ignored) {
                // still persist removal
            }
        }

        ticketRepo.save(ticket);
        Ticket reloaded = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        return mapToResponse(reloaded);
    }

    @Override
    public TicketResponse replaceTechnicianEvidence(String ticketId, String attachmentId, MultipartFile file) {
        Ticket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertTechnicianCanModifyTicketContent(ticket);

        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Attachment file is required.");
        }

        ensureMutableTechnicianAttachmentList(ticket);
        Attachment found = findInAttachmentList(ticket.getTechnicianAttachments(), attachmentId);
        if (found == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Evidence not found");
        }

        String oldPath = found.getFilePath();
        Attachment newMeta = persistUploadedFile(file);
        found.setFileName(newMeta.getFileName());
        found.setFilePath(newMeta.getFilePath());

        if (oldPath != null && !oldPath.equals(found.getFilePath())) {
            try {
                Files.deleteIfExists(Paths.get(oldPath));
            } catch (IOException ignored) {
                // ignore
            }
        }

        ticketRepo.save(ticket);
        Ticket reloaded = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        return mapToResponse(reloaded);
    }

    @Override
    public TicketResponse deleteAttachment(String ticketId, String attachmentId) {
        Ticket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found"));
        assertCanModifyRequesterAttachments(ticket);

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
        Attachment att = findAttachmentInTicket(ticket, attachmentId);
        if (att == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Attachment not found");
        }
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

    private void ensureMutableUpdatesList(Ticket ticket) {
        List<TicketUpdate> current = ticket.getUpdates();
        if (current == null) {
            ticket.setUpdates(new ArrayList<>());
        } else {
            ticket.setUpdates(new ArrayList<>(current));
        }
    }

    /**
     * Notes / technician updates: only the assigned technician may add, edit, or remove while the ticket
     * is still mutable (not resolved or withdrawn).
     */
    private void assertTechnicianCanModifyTicketContent(Ticket ticket) {
        assertCanViewTicket(ticket);
        assertTicketOwnerMutable(ticket);
        AuthenticatedUser user = requireAuthenticatedUser();
        if (user.getRole() != Role.TECHNICIAN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the assigned technician can manage ticket updates.");
        }
        String assignedId = ticket.getAssignedTechnicianUserId();
        if (assignedId == null || !assignedId.equals(user.getUserId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the assigned technician can manage ticket updates.");
        }
        if (!technicianHasAccepted(ticket)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Accept this assignment before posting updates or uploading evidence.");
        }
    }

    private String displayNameForAuthenticatedUser(AuthenticatedUser user) {
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            return user.getEmail().trim();
        }
        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName().trim();
        }
        return "Technician";
    }

    private List<TicketUpdateResponse> mapUpdates(Ticket ticket) {
        if (ticket.getUpdates() == null || ticket.getUpdates().isEmpty()) {
            return new ArrayList<>();
        }
        return ticket.getUpdates().stream()
                .sorted(Comparator.comparing(TicketUpdate::getTimestamp, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .map(u -> {
                    TicketUpdateResponse r = new TicketUpdateResponse();
                    r.setId(u.getId());
                    r.setMessage(u.getMessage());
                    r.setUpdatedBy(u.getUpdatedBy());
                    r.setTimestamp(u.getTimestamp());
                    return r;
                })
                .collect(Collectors.toList());
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
            if (assignedId != null && assignedId.equals(user.getUserId())) {
                return;
            }
            String lastReject = ticket.getLastRejectedByTechnicianUserId();
            if (lastReject != null && lastReject.equals(user.getUserId())) {
                return;
            }
            String prior = ticket.getWithdrawalPriorTechnicianUserId();
            if ("WITHDRAWN".equals(normalizeTicketStatus(ticket.getStatus()))
                    && prior != null
                    && prior.equals(user.getUserId())) {
                return;
            }
            throw new ApiException(HttpStatus.NOT_FOUND, "Ticket not found");
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
        res.setTechnicianAssignmentRejectionNote(ticket.getTechnicianAssignmentRejectionNote());
        res.setTechnicianAcceptance(ticket.getTechnicianAcceptance());
        res.setAttachments(mapAttachments(ticket));
        res.setTechnicianAttachments(mapTechnicianAttachments(ticket));
        res.setUpdates(mapUpdates(ticket));

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

    private List<AttachmentResponse> mapTechnicianAttachments(Ticket ticket) {
        if (ticket.getTechnicianAttachments() == null || ticket.getTechnicianAttachments().isEmpty()) {
            return new ArrayList<>();
        }
        return ticket.getTechnicianAttachments().stream().map(a -> {
            AttachmentResponse r = new AttachmentResponse();
            r.setId(a.getId());
            r.setFileName(a.getFileName());
            return r;
        }).collect(Collectors.toList());
    }

    private Attachment findAttachmentInTicket(Ticket ticket, String attachmentId) {
        if (attachmentId == null) {
            return null;
        }
        Attachment a = findInAttachmentList(ticket.getAttachments(), attachmentId);
        if (a != null) {
            return a;
        }
        return findInAttachmentList(ticket.getTechnicianAttachments(), attachmentId);
    }

    private static Attachment findInAttachmentList(List<Attachment> list, String attachmentId) {
        if (list == null || list.isEmpty()) {
            return null;
        }
        return list.stream()
                .filter(x -> attachmentId != null && attachmentId.equals(x.getId()))
                .findFirst()
                .orElse(null);
    }

    private Attachment persistUploadedFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Attachment file is required.");
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
            return attachment;
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "File upload failed.");
        }
    }

    private void ensureMutableTechnicianAttachmentList(Ticket ticket) {
        List<Attachment> current = ticket.getTechnicianAttachments();
        if (current == null) {
            ticket.setTechnicianAttachments(new ArrayList<>());
        } else {
            ticket.setTechnicianAttachments(new ArrayList<>(current));
        }
    }

    /** Requester attachments: submitter only, or admin (support). */
    private void assertCanModifyRequesterAttachments(Ticket ticket) {
        assertCanViewTicket(ticket);
        assertTicketOwnerMutable(ticket);
        AuthenticatedUser user = requireAuthenticatedUser();
        if (user.getRole() == Role.ADMIN) {
            return;
        }
        assertTicketSubmitter(ticket);
    }

    private void requireAssignedTechnician(Ticket ticket, AuthenticatedUser user) {
        String assignedId = ticket.getAssignedTechnicianUserId();
        if (assignedId == null || !assignedId.equals(user.getUserId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the assigned technician can perform this action.");
        }
    }

    private void assertTechnicianStatusChange(Ticket ticket, String toStatus) {
        String from = normalizeTicketStatus(ticket.getStatus());
        if (("ASSIGNED".equals(from) || "IN_PROGRESS".equals(from)) && !technicianHasAccepted(ticket)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Accept or reject this assignment before changing status.");
        }
        boolean activeAcceptedWork = "ACCEPTED".equals(from)
                || ("IN_PROGRESS".equals(from) && technicianHasAccepted(ticket));
        if (activeAcceptedWork) {
            if ("RESOLVED".equals(toStatus) || from.equals(toStatus)) {
                ensureValidStatusEnum(toStatus);
                return;
            }
            throw new ApiException(HttpStatus.BAD_REQUEST, "You can only mark this ticket as resolved.");
        }
        if ("RESOLVED".equals(from)) {
            if ("ACCEPTED".equals(toStatus) || "IN_PROGRESS".equals(toStatus)) {
                ensureValidStatusEnum(toStatus);
                return;
            }
            throw new ApiException(HttpStatus.BAD_REQUEST, "Reopen by setting status to Accepted or In progress.");
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "Status cannot be changed from the current state.");
    }

    private void ensureValidStatusEnum(String s) {
        if (!VALID_TICKET_STATUSES.contains(s)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid status.");
        }
    }

    private static String normalizeTicketStatus(String raw) {
        if (raw == null) {
            return "";
        }
        String s = raw.trim().toUpperCase().replace(' ', '_');
        return switch (s) {
            case "WITHDRAW" -> "WITHDRAWN";
            case "REJECT" -> "REJECTED";
            case "INPROGRESS" -> "IN_PROGRESS";
            case "ACCEPT" -> "ACCEPTED";
            default -> s;
        };
    }

    /**
     * Legacy {@code ASSIGNED}, or {@code IN_PROGRESS} with {@code PENDING} acceptance, or legacy rows with no
     * acceptance field yet (treated as pending until the technician explicitly accepts).
     */
    private boolean technicianAwaitingAcceptance(Ticket ticket) {
        String from = normalizeTicketStatus(ticket.getStatus());
        if ("ASSIGNED".equals(from)) {
            return true;
        }
        if (!"IN_PROGRESS".equals(from)) {
            return false;
        }
        String acc = normalizeTechnicianAcceptance(ticket.getTechnicianAcceptance());
        return acc.isEmpty() || TECH_ACCEPT_PENDING.equals(acc);
    }

    /**
     * Technician may post updates / resolve only after explicit acceptance: status {@code ACCEPTED}, or
     * {@code IN_PROGRESS} with {@code technicianAcceptance === ACCEPTED}.
     */
    private boolean technicianHasAccepted(Ticket ticket) {
        String from = normalizeTicketStatus(ticket.getStatus());
        if ("ACCEPTED".equals(from)) {
            return true;
        }
        if (!"IN_PROGRESS".equals(from)) {
            return false;
        }
        String acc = normalizeTechnicianAcceptance(ticket.getTechnicianAcceptance());
        return TECH_ACCEPT_ACCEPTED.equals(acc);
    }

    private static String normalizeTechnicianAcceptance(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.trim().toUpperCase();
    }

    private void notifyAdminsTicketCreated(Ticket ticket, AuthenticatedUser reporter) {
        if (ticket == null || reporter == null) {
            return;
        }
        List<String> admins = activeAdminRecipientIds();
        if (admins.isEmpty()) {
            return;
        }
        UserAccount reporterAccount = userAccountRepository.findById(reporter.getUserId()).orElse(null);
        String reporterLabel = displayNameForUser(reporterAccount, "A user");
        String ref = ticketRef(ticket);
        String title = safeTitle(ticket);
        String where = ticketWhereClause(ticket);
        String msg = String.format("%s submitted %s for %s%s.", reporterLabel, ref, title, where);
        notificationService.deliverMany(
                admins,
                NotificationType.TICKET_CREATED,
                NotificationCategory.TICKET,
                "New ticket submitted",
                msg,
                NotificationRelatedEntity.TICKET,
                ticket.getId(),
                reporter.getUserId());
    }

    private void notifyTicketAssigned(Ticket ticket, String technicianUserId, String adminActorUserId) {
        try {
            UserAccount admin = userAccountRepository.findById(adminActorUserId).orElse(null);
            String adminLabel = displayNameForUser(admin, "Admin");
            String where = ticketWhereClause(ticket);
            String msg = String.format(
                    "You have been assigned to ticket %s for %s%s by %s.",
                    ticketRef(ticket),
                    safeTitle(ticket),
                    where,
                    adminLabel);
            notificationService.deliver(
                    technicianUserId,
                    NotificationType.TICKET_ASSIGNED,
                    NotificationCategory.TICKET,
                    "New ticket assigned to you",
                    msg,
                    NotificationRelatedEntity.TICKET,
                    ticket.getId(),
                    adminActorUserId);
        } catch (RuntimeException ignored) {
        }
    }

    private void notifyAssignmentAccepted(Ticket ticket, String technicianActorUserId) {
        try {
            UserAccount tech = userAccountRepository.findById(technicianActorUserId).orElse(null);
            String techLabel = displayNameForUser(tech, "Technician");
            String where = ticketWhereClause(ticket);
            List<String> admins = activeAdminRecipientIds();
            String ref = ticketRef(ticket);
            String title = safeTitle(ticket);
            if (!admins.isEmpty()) {
                String adminMsg = String.format(
                        "Technician %s has accepted ticket %s for %s%s.",
                        techLabel,
                        ref,
                        title,
                        where);
                notificationService.deliverMany(
                        admins,
                        NotificationType.TICKET_ASSIGNMENT_ACCEPTED,
                        NotificationCategory.TICKET,
                        "Technician accepted an assignment",
                        adminMsg,
                        NotificationRelatedEntity.TICKET,
                        ticket.getId(),
                        technicianActorUserId);
            }
            String ownerId = ticket.getCreatedByUserId();
            if (ownerId != null && !ownerId.isBlank()) {
                String userMsg = String.format(
                        "Technician %s has accepted your ticket %s for %s%s and will start working on it.",
                        techLabel,
                        ref,
                        title,
                        where);
                notificationService.deliver(
                        ownerId,
                        NotificationType.TICKET_ASSIGNMENT_ACCEPTED,
                        NotificationCategory.TICKET,
                        "Your ticket was accepted",
                        userMsg,
                        NotificationRelatedEntity.TICKET,
                        ticket.getId(),
                        technicianActorUserId);
            }
        } catch (RuntimeException ignored) {
        }
    }

    private void notifyAssignmentRejected(Ticket ticket, String technicianActorUserId, String reason) {
        try {
            UserAccount tech = userAccountRepository.findById(technicianActorUserId).orElse(null);
            String techLabel = displayNameForUser(tech, "Technician");
            String where = ticketWhereClause(ticket);
            List<String> admins = activeAdminRecipientIds();
            String ref = ticketRef(ticket);
            String title = safeTitle(ticket);
            if (!admins.isEmpty()) {
                String adminMsg = String.format(
                        "Technician %s rejected ticket %s for %s%s. Reason: %s",
                        techLabel,
                        ref,
                        title,
                        where,
                        reason);
                notificationService.deliverMany(
                        admins,
                        NotificationType.TICKET_ASSIGNMENT_REJECTED,
                        NotificationCategory.TICKET,
                        "Technician rejected an assignment",
                        adminMsg,
                        NotificationRelatedEntity.TICKET,
                        ticket.getId(),
                        technicianActorUserId);
            }
            String ownerId = ticket.getCreatedByUserId();
            if (ownerId != null && !ownerId.isBlank()) {
                String userMsg = String.format(
                        "Technician assignment for your ticket %s for %s%s was rejected. Reason: %s Your request will be reassigned by the admin.",
                        ref,
                        title,
                        where,
                        reason);
                notificationService.deliver(
                        ownerId,
                        NotificationType.TICKET_ASSIGNMENT_REJECTED,
                        NotificationCategory.TICKET,
                        "Assignment returned to the desk",
                        userMsg,
                        NotificationRelatedEntity.TICKET,
                        ticket.getId(),
                        technicianActorUserId);
            }
        } catch (RuntimeException ignored) {
        }
    }

    private void notifyTicketWithdrawnByUser(Ticket ticket, String priorTechnicianUserId) {
        try {
            String reporterId = ticket.getCreatedByUserId();
            UserAccount reporter = reporterId != null ? userAccountRepository.findById(reporterId).orElse(null) : null;
            String who = displayNameForUser(reporter, "A user");
            String where = ticketWhereClause(ticket);
            String ref = ticketRef(ticket);
            String title = safeTitle(ticket);
            List<String> admins = activeAdminRecipientIds();
            if (!admins.isEmpty()) {
                String adminMsg = String.format(
                        "User %s has withdrawn ticket %s for %s%s.",
                        who,
                        ref,
                        title,
                        where);
                notificationService.deliverMany(
                        admins,
                        NotificationType.TICKET_WITHDRAWN_BY_USER,
                        NotificationCategory.TICKET,
                        "Ticket withdrawn by requester",
                        adminMsg,
                        NotificationRelatedEntity.TICKET,
                        ticket.getId(),
                        reporterId);
            }
            if (priorTechnicianUserId != null && !priorTechnicianUserId.isBlank()) {
                String techMsg = String.format(
                        "Ticket %s for %s%s has been withdrawn by the user and removed from your assigned work queue.",
                        ref,
                        title,
                        where);
                notificationService.deliver(
                        priorTechnicianUserId,
                        NotificationType.TICKET_WITHDRAWN_BY_USER,
                        NotificationCategory.TICKET,
                        "Ticket withdrawn by requester",
                        techMsg,
                        NotificationRelatedEntity.TICKET,
                        ticket.getId(),
                        reporterId);
            }
        } catch (RuntimeException ignored) {
        }
    }

    private void notifyTicketResolved(Ticket ticket, String technicianActorUserId) {
        try {
            UserAccount tech = userAccountRepository.findById(technicianActorUserId).orElse(null);
            String techLabel = displayNameForUser(tech, "Technician");
            String where = ticketWhereClause(ticket);
            String ref = ticketRef(ticket);
            String title = safeTitle(ticket);
            String resNote = latestTechnicianUpdateSummary(ticket);
            String resolutionPart =
                    resNote != null && !resNote.isBlank() ? " Resolution: " + resNote : "";
            String ownerId = ticket.getCreatedByUserId();
            if (ownerId == null || ownerId.isBlank()) {
                return;
            }
            String msg = String.format(
                    "Your ticket %s for %s%s has been resolved by Technician %s.%s",
                    ref,
                    title,
                    where,
                    techLabel,
                    resolutionPart);
            notificationService.deliver(
                    ownerId,
                    NotificationType.TICKET_RESOLVED,
                    NotificationCategory.TICKET,
                    "Ticket resolved",
                    msg,
                    NotificationRelatedEntity.TICKET,
                    ticket.getId(),
                    technicianActorUserId);
        } catch (RuntimeException ignored) {
        }
    }

    private String latestTechnicianUpdateSummary(Ticket ticket) {
        List<TicketUpdate> updates = ticket.getUpdates();
        if (updates == null || updates.isEmpty()) {
            return null;
        }
        return updates.stream()
                .max(Comparator.comparing(TicketUpdate::getTimestamp, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(TicketUpdate::getMessage)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .orElse(null);
    }

    private static String ticketRef(Ticket ticket) {
        if (ticket == null || ticket.getId() == null || ticket.getId().isBlank()) {
            return "#TCK";
        }
        String id = ticket.getId().replace("-", "");
        String shortId = id.length() > 8 ? id.substring(0, 8).toUpperCase() : id.toUpperCase();
        return "#TCK-" + shortId;
    }

    private static String safeTitle(Ticket ticket) {
        if (ticket == null || ticket.getTitle() == null || ticket.getTitle().isBlank()) {
            return "your campus ticket";
        }
        return ticket.getTitle().trim();
    }

    private String ticketWhereClause(Ticket ticket) {
        if (ticket == null) {
            return "";
        }
        try {
            List<String> parts = new ArrayList<>();
            if (ticket.getCategoryId() != null) {
                categoryRepository
                        .findById(ticket.getCategoryId())
                        .ifPresent(
                                c -> {
                                    if (c.getName() != null && !c.getName().isBlank()) {
                                        parts.add(c.getName().trim());
                                    }
                                });
            }
            if (ticket.getSubCategoryId() != null) {
                subCategoryRepository
                        .findById(ticket.getSubCategoryId())
                        .ifPresent(
                                s -> {
                                    if (s.getName() != null && !s.getName().isBlank()) {
                                        parts.add(s.getName().trim());
                                    }
                                });
            }
            if (!parts.isEmpty()) {
                return " in " + String.join(" · ", parts);
            }
        } catch (RuntimeException ignored) {
        }
        return "";
    }

    private static String displayNameForUser(UserAccount user, String fallback) {
        if (user == null) {
            return fallback;
        }
        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName().trim();
        }
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            return user.getEmail().trim();
        }
        return fallback;
    }

    private List<String> activeAdminRecipientIds() {
        return userAccountRepository.findByRoleOrderByFullNameAsc(Role.ADMIN).stream()
                .filter(u -> u.getStatus() == AccountStatus.ACTIVE)
                .map(UserAccount::getId)
                .toList();
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
