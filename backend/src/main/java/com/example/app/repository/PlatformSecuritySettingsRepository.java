package com.example.app.repository;

import com.example.app.entity.PlatformSecuritySettings;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PlatformSecuritySettingsRepository extends MongoRepository<PlatformSecuritySettings, String> {}
