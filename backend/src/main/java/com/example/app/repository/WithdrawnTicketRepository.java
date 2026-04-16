package com.example.app.repository;

import com.example.app.entity.WithdrawnTicketRecord;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface WithdrawnTicketRepository extends MongoRepository<WithdrawnTicketRecord, String> {

    List<WithdrawnTicketRecord> findByTicketId(String ticketId);

    List<WithdrawnTicketRecord> findByWithdrawnByUserIdOrderByWithdrawnAtDesc(String withdrawnByUserId);
}
