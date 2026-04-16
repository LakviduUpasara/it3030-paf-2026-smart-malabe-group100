package com.example.app.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@Configuration
@EnableMongoAuditing
public class MongoAuditConfig {
    // Enables created and updated timestamps for Mongo documents.
}
