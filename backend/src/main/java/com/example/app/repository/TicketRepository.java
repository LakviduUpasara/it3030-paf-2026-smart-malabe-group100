package com.example.app.repository;

import com.example.app.entity.Ticket;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TicketRepository extends MongoRepository<Ticket, String> {

    List<Ticket> findByCreatedByUserIdOrderByCreatedAtDesc(String createdByUserId);
}
