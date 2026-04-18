package com.example.app.notifications.repository;

import com.example.app.notifications.document.PortalDataEntry;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PortalDataEntryRepository extends MongoRepository<PortalDataEntry, String> {}
