package com.example.app.service;

import com.example.app.dto.AssignTicketRequest;
import com.example.app.dto.TicketAttachmentDownload;
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

    /** Assigned technician posts a public update (visible to the requester). */
    TicketResponse addUpdateToTicket(String id, UpdateRequest request);

    TicketResponse patchTicketUpdate(String ticketId, String updateId, UpdateRequest request);

    TicketResponse deleteTicketUpdate(String ticketId, String updateId);

    /** Upload requester evidence (submitter only; max 3). */
    TicketResponse uploadAttachment(String id, MultipartFile file);

    /** Remove requester attachment (submitter or admin; ticket must still be mutable). */
    TicketResponse deleteAttachment(String ticketId, String attachmentId);

    /** Assigned technician uploads evidence (max 3); stored separately from requester attachments. */
    TicketResponse uploadTechnicianEvidence(String ticketId, MultipartFile file);

    TicketResponse deleteTechnicianEvidence(String ticketId, String attachmentId);

    /** Replace one technician evidence file (same id, new file on disk). */
    TicketResponse replaceTechnicianEvidence(String ticketId, String attachmentId, MultipartFile file);

    /** Binary file for requester or technician attachment (viewer must be allowed to see the ticket). */
    TicketAttachmentDownload getAttachmentDownload(String ticketId, String attachmentId);

    /** Submitter may update title, description, category, and subcategory while ticket is open or in progress. */
    TicketResponse updateMyTicket(String id, TicketRequest request);

    /** Submitter may withdraw (cancel) their own ticket while it is open or in progress. */
    TicketResponse withdrawMyTicket(String id, WithdrawTicketRequest request);

    /** Admin assigns a technician to a ticket. */
    TicketResponse assignTechnician(String ticketId, AssignTicketRequest request);
}