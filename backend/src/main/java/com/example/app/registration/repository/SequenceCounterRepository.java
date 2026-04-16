package com.example.app.registration.repository;

import com.example.app.registration.document.SequenceCounter;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SequenceCounterRepository extends MongoRepository<SequenceCounter, String> {}
