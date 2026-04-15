package com.example.app.controller;

import com.example.app.dto.TicketRequest;
import com.example.app.dto.TicketResponse;
import com.example.app.dto.UpdateRequest;
import com.example.app.service.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
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
    public ResponseEntity<TicketResponse> createTicket(@RequestBody TicketRequest request) {
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
}