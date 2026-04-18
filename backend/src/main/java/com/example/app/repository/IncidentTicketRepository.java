package com.example.app.repository;

import com.example.app.entity.IncidentTicket;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface IncidentTicketRepository extends MongoRepository<IncidentTicket, String> {

    List<IncidentTicket> findByAssigneeTechnicianIdOrderByUpdatedAtDesc(String assigneeTechnicianId);

    List<IncidentTicket> findByReporterUserIdOrderByUpdatedAtDesc(String reporterUserId);

    List<IncidentTicket> findAllByOrderByUpdatedAtDesc();
}
