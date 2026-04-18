package com.example.app.repository;

import com.example.app.entity.Notification;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NotificationRepository extends MongoRepository<Notification, String> {

    Page<Notification> findByRecipientUserIdOrderByCreatedAtDesc(String recipientUserId, Pageable pageable);

    Page<Notification> findByRecipientUserIdAndIsReadFalseOrderByCreatedAtDesc(
            String recipientUserId, Pageable pageable);

    long countByRecipientUserIdAndIsReadFalse(String recipientUserId);

    List<Notification> findByRecipientUserIdAndIsReadFalse(String recipientUserId);

    Page<Notification> findByCreatedByOrderByCreatedAtDesc(String createdBy, Pageable pageable);
}
