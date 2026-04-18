package com.example.app.ticket;

import com.example.app.dto.ticket.AdminAssignTicketRequest;
import com.example.app.dto.ticket.CreateTicketRequest;
import com.example.app.dto.ticket.IncidentTicketResponse;
import com.example.app.dto.ticket.TechnicianProgressNoteRequest;
import com.example.app.dto.ticket.TechnicianResolutionNotesRequest;
import com.example.app.dto.ticket.TechnicianResolveTicketRequest;
import com.example.app.dto.ticket.TechnicianOptionResponse;
import com.example.app.dto.ticket.TechnicianTicketStatusRequest;
import com.example.app.security.AuthenticatedUser;
import java.util.List;

public interface IncidentTicketService {

    IncidentTicketResponse createTicket(AuthenticatedUser reporter, CreateTicketRequest request);

    List<IncidentTicketResponse> listMyReportedTickets(AuthenticatedUser user);

    List<IncidentTicketResponse> listAllForAdmin();

    List<TechnicianOptionResponse> listAssignableTechnicians();

    IncidentTicketResponse assignTicket(AuthenticatedUser admin, String ticketId, AdminAssignTicketRequest request);

    List<IncidentTicketResponse> listAssignedToTechnician(AuthenticatedUser technician);

    IncidentTicketResponse getForTechnician(AuthenticatedUser technician, String ticketId);

    IncidentTicketResponse updateStatusForTechnician(AuthenticatedUser technician, String ticketId, TechnicianTicketStatusRequest request);

    IncidentTicketResponse addProgressNoteForTechnician(
            AuthenticatedUser technician,
            String ticketId,
            TechnicianProgressNoteRequest request
    );

    IncidentTicketResponse updateResolutionNotesForTechnician(
            AuthenticatedUser technician,
            String ticketId,
            TechnicianResolutionNotesRequest request
    );

    IncidentTicketResponse resolveForTechnician(AuthenticatedUser technician, String ticketId, TechnicianResolveTicketRequest request);
}
