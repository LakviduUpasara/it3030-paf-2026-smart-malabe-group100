package com.example.app.controller;

import com.example.app.dto.AssignTicketRequest;
import com.example.app.dto.TicketAttachmentDownload;
import com.example.app.dto.TicketRequest;
import com.example.app.dto.TicketResponse;
import com.example.app.dto.UpdateRequest;
import com.example.app.dto.WithdrawTicketRequest;
import com.example.app.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tickets")
@CrossOrigin
public class TicketController {

    @Autowired
    private TicketService service;

    // ✅ CREATE TICKET
    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(@Valid @RequestBody TicketRequest request) {
        return ResponseEntity.ok(service.createTicket(request));
    }

    // ✅ GET ALL TICKETS
    @GetMapping
    public ResponseEntity<List<TicketResponse>> getAllTickets() {
        return ResponseEntity.ok(service.getAllTickets());
    }

    // ✅ GET SINGLE TICKET
    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable String id) {
        return ResponseEntity.ok(service.getTicketById(id));
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<TicketResponse> assignTechnician(@PathVariable String id,
                                                           @Valid @RequestBody AssignTicketRequest request) {
        return ResponseEntity.ok(service.assignTechnician(id, request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TicketResponse> updateMyTicket(@PathVariable String id,
                                                          @Valid @RequestBody TicketRequest request) {
        return ResponseEntity.ok(service.updateMyTicket(id, request));
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<TicketResponse> withdrawMyTicket(@PathVariable String id,
                                                            @Valid @RequestBody WithdrawTicketRequest request) {
        return ResponseEntity.ok(service.withdrawMyTicket(id, request));
    }

    // ✅ UPDATE STATUS (Technician)
    @PutMapping("/{id}/status")
    public ResponseEntity<String> updateStatus(@PathVariable String id,
                                               @RequestParam String status) {
        service.updateTicketStatus(id, status);
        return ResponseEntity.ok("Status updated");
    }

    // ✅ ADD TECHNICIAN UPDATE
    @PostMapping("/{id}/updates")
    public ResponseEntity<String> addUpdate(@PathVariable String id,
                                           @RequestBody UpdateRequest request) {
        service.addUpdateToTicket(id, request);
        return ResponseEntity.ok("Update added");
    }

    // ✅ UPLOAD ATTACHMENT
    @PostMapping("/{id}/attachments")
    public ResponseEntity<String> uploadAttachment(@PathVariable String id,
                                                   @RequestParam("file") MultipartFile file) {
        service.uploadAttachment(id, file);
        return ResponseEntity.ok("File uploaded successfully");
    }

    @DeleteMapping("/{ticketId}/attachments/{attachmentId}")
    public ResponseEntity<TicketResponse> deleteAttachment(@PathVariable String ticketId,
                                                           @PathVariable String attachmentId) {
        return ResponseEntity.ok(service.deleteAttachment(ticketId, attachmentId));
    }

    @GetMapping("/{ticketId}/attachments/{attachmentId}")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable String ticketId,
                                                     @PathVariable String attachmentId) {
        TicketAttachmentDownload d = service.getAttachmentDownload(ticketId, attachmentId);
        ContentDisposition disposition = ContentDisposition.inline()
                .filename(d.fileName(), java.nio.charset.StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .contentType(MediaType.parseMediaType(d.contentType()))
                .body(d.bytes());
    }
}