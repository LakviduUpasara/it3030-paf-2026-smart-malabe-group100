package com.example.app.repository;

import com.example.app.entity.Attachment;
import com.example.app.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    // Get all attachments for a specific ticket
    List<Attachment> findByTicket(Ticket ticket);

}