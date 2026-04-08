package com.example.app.repository;

import com.example.app.entity.TicketUpdate;
import com.example.app.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketUpdateRepository extends JpaRepository<TicketUpdate, Long> {

    // Get all updates for a specific ticket
    List<TicketUpdate> findByTicket(Ticket ticket);

}