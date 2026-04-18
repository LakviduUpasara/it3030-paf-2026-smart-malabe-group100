package com.example.app.ticket;

import com.example.app.dto.ticket.AdminAssignTicketRequest;
import com.example.app.dto.ticket.CreateTicketRequest;
import com.example.app.dto.ticket.IncidentTicketResponse;
import com.example.app.dto.ticket.TechnicianOptionResponse;
import com.example.app.dto.ticket.TechnicianProgressNoteRequest;
import com.example.app.dto.ticket.TechnicianResolutionNotesRequest;
import com.example.app.dto.ticket.TechnicianResolveTicketRequest;
import com.example.app.dto.ticket.TechnicianTicketStatusRequest;
import com.example.app.entity.IncidentTicket;
import com.example.app.entity.TicketProgressNote;
import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.IncidentTicketStatus;
import com.example.app.entity.enums.Role;
import com.example.app.entity.enums.TicketPriority;
import com.example.app.exception.ApiException;
import com.example.app.repository.IncidentTicketRepository;
import com.example.app.repository.UserAccountRepository;
import com.example.app.security.AuthenticatedUser;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class IncidentTicketServiceImpl implements IncidentTicketService {

    private final IncidentTicketRepository incidentTicketRepository;
    private final UserAccountRepository userAccountRepository;

    @Override
    public IncidentTicketResponse createTicket(AuthenticatedUser reporter, CreateTicketRequest request) {
        IncidentTicket ticket = IncidentTicket.builder()
                .id(UUID.randomUUID().toString())
                .reference(newReference())
                .title(request.getTitle().trim())
                .description(trimToNull(request.getDescription()))
                .category(trimToNull(request.getCategory()))
                .location(trimToNull(request.getLocation()))
                .priority(request.getPriority() != null ? request.getPriority() : TicketPriority.MEDIUM)
                .status(IncidentTicketStatus.OPEN)
                .reporterUserId(reporter.getUserId())
                .assigneeTechnicianId(null)
                .progressNotes(new ArrayList<>())
                .build();

        return withNames(incidentTicketRepository.save(ticket));
    }

    @Override
    public List<IncidentTicketResponse> listMyReportedTickets(AuthenticatedUser user) {
        return mapWithNames(incidentTicketRepository.findByReporterUserIdOrderByUpdatedAtDesc(user.getUserId()));
    }

    @Override
    public List<IncidentTicketResponse> listAllForAdmin() {
        return mapWithNames(incidentTicketRepository.findAllByOrderByUpdatedAtDesc());
    }

    @Override
    public List<TechnicianOptionResponse> listAssignableTechnicians() {
        return userAccountRepository.findByRoleInOrderByCreatedAtDesc(List.of(Role.TECHNICIAN)).stream()
                .filter(user -> user.getStatus() == AccountStatus.ACTIVE)
                .map(user -> TechnicianOptionResponse.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .build())
                .toList();
    }

    @Override
    public IncidentTicketResponse assignTicket(AuthenticatedUser admin, String ticketId, AdminAssignTicketRequest request) {
        IncidentTicket ticket = loadTicket(ticketId);
        UserAccount assignee = userAccountRepository
                .findById(request.getAssigneeTechnicianId().trim())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Assignee user was not found."));
        if (assignee.getRole() != Role.TECHNICIAN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Assignee must be a technician account.");
        }
        ticket.setAssigneeTechnicianId(assignee.getId());
        if (ticket.getStatus() == IncidentTicketStatus.OPEN) {
            ticket.setStatus(IncidentTicketStatus.ASSIGNED);
        }
        return withNames(incidentTicketRepository.save(ticket));
    }

    @Override
    public List<IncidentTicketResponse> listAssignedToTechnician(AuthenticatedUser technician) {
        return mapWithNames(
                incidentTicketRepository.findByAssigneeTechnicianIdOrderByUpdatedAtDesc(technician.getUserId())
        );
    }

    @Override
    public IncidentTicketResponse getForTechnician(AuthenticatedUser technician, String ticketId) {
        IncidentTicket ticket = loadTicket(ticketId);
        assertTechnicianAssigned(ticket, technician.getUserId());
        return withNames(ticket);
    }

    @Override
    public IncidentTicketResponse updateStatusForTechnician(
            AuthenticatedUser technician,
            String ticketId,
            TechnicianTicketStatusRequest request
    ) {
        IncidentTicket ticket = loadTicket(ticketId);
        assertTechnicianAssigned(ticket, technician.getUserId());
        if (ticket.getStatus() == IncidentTicketStatus.RESOLVED || ticket.getStatus() == IncidentTicketStatus.CLOSED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ticket is already resolved or closed.");
        }
        IncidentTicketStatus next = request.getStatus();
        if (next == IncidentTicketStatus.RESOLVED || next == IncidentTicketStatus.CLOSED) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Use POST /api/v1/technician/tickets/{id}/actions/resolve to resolve this ticket."
            );
        }
        ticket.setStatus(next);
        return withNames(incidentTicketRepository.save(ticket));
    }

    @Override
    public IncidentTicketResponse addProgressNoteForTechnician(
            AuthenticatedUser technician,
            String ticketId,
            TechnicianProgressNoteRequest request
    ) {
        IncidentTicket ticket = loadTicket(ticketId);
        assertTechnicianAssigned(ticket, technician.getUserId());
        if (ticket.getStatus() == IncidentTicketStatus.RESOLVED || ticket.getStatus() == IncidentTicketStatus.CLOSED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot add updates to a resolved or closed ticket.");
        }
        TicketProgressNote note = TicketProgressNote.builder()
                .id(UUID.randomUUID().toString())
                .content(request.getContent().trim())
                .authorUserId(technician.getUserId())
                .authorDisplayName(technician.getFullName())
                .createdAt(LocalDateTime.now())
                .build();
        if (ticket.getProgressNotes() == null) {
            ticket.setProgressNotes(new ArrayList<>());
        }
        ticket.getProgressNotes().add(note);
        if (ticket.getStatus() == IncidentTicketStatus.OPEN || ticket.getStatus() == IncidentTicketStatus.ASSIGNED) {
            ticket.setStatus(IncidentTicketStatus.IN_PROGRESS);
        }
        return withNames(incidentTicketRepository.save(ticket));
    }

    @Override
    public IncidentTicketResponse updateResolutionNotesForTechnician(
            AuthenticatedUser technician,
            String ticketId,
            TechnicianResolutionNotesRequest request
    ) {
        IncidentTicket ticket = loadTicket(ticketId);
        assertTechnicianAssigned(ticket, technician.getUserId());
        if (request.getResolutionNotes() != null) {
            ticket.setResolutionNotes(request.getResolutionNotes().trim());
        }
        return withNames(incidentTicketRepository.save(ticket));
    }

    @Override
    public IncidentTicketResponse resolveForTechnician(
            AuthenticatedUser technician,
            String ticketId,
            TechnicianResolveTicketRequest request
    ) {
        IncidentTicket ticket = loadTicket(ticketId);
        assertTechnicianAssigned(ticket, technician.getUserId());
        if (ticket.getStatus() == IncidentTicketStatus.RESOLVED || ticket.getStatus() == IncidentTicketStatus.CLOSED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ticket is already resolved or closed.");
        }
        ticket.setStatus(IncidentTicketStatus.RESOLVED);
        ticket.setResolvedAt(LocalDateTime.now());
        if (request != null && StringUtils.hasText(request.getResolutionNotes())) {
            ticket.setResolutionNotes(request.getResolutionNotes().trim());
        }
        return withNames(incidentTicketRepository.save(ticket));
    }

    private IncidentTicketResponse withNames(IncidentTicket ticket) {
        return mapWithNames(List.of(ticket)).getFirst();
    }

    private List<IncidentTicketResponse> mapWithNames(List<IncidentTicket> tickets) {
        if (tickets.isEmpty()) {
            return List.of();
        }
        Set<String> ids = new HashSet<>();
        for (IncidentTicket t : tickets) {
            if (t.getAssigneeTechnicianId() != null) {
                ids.add(t.getAssigneeTechnicianId());
            }
            if (t.getReporterUserId() != null) {
                ids.add(t.getReporterUserId());
            }
        }
        Map<String, UserAccount> byId = new HashMap<>();
        userAccountRepository.findAllById(ids).forEach(user -> byId.put(user.getId(), user));
        return tickets.stream()
                .map(ticket -> {
                    IncidentTicketResponse response = IncidentTicketMapper.toResponse(ticket);
                    if (ticket.getAssigneeTechnicianId() != null) {
                        UserAccount assignee = byId.get(ticket.getAssigneeTechnicianId());
                        if (assignee != null) {
                            response.setAssigneeDisplayName(assignee.getFullName());
                        }
                    }
                    if (ticket.getReporterUserId() != null) {
                        UserAccount reporter = byId.get(ticket.getReporterUserId());
                        if (reporter != null) {
                            response.setReporterDisplayName(reporter.getFullName());
                        }
                    }
                    return response;
                })
                .toList();
    }

    private static void assertTechnicianAssigned(IncidentTicket ticket, String technicianUserId) {
        if (!Objects.equals(ticket.getAssigneeTechnicianId(), technicianUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This ticket is not assigned to you.");
        }
    }

    private IncidentTicket loadTicket(String ticketId) {
        if (ticketId == null || ticketId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ticket id is required.");
        }
        return incidentTicketRepository
                .findById(ticketId.trim())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ticket not found."));
    }

    private static String newReference() {
        return "TK-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
