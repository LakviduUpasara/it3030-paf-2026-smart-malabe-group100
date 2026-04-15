package com.example.app.repository;

import com.example.app.entity.Ticket;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByCreatedByUserIdOrderByCreatedAtDesc(String createdByUserId);
}