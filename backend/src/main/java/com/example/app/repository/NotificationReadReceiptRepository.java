package com.example.app.repository;

import com.example.app.entity.NotificationReadReceipt;
import java.util.Collection;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NotificationReadReceiptRepository extends MongoRepository<NotificationReadReceipt, String> {

    List<NotificationReadReceipt> findByUserIdAndFeedItemIdIn(String userId, Collection<String> feedItemIds);

    long countByUserIdAndFeedItemIdIn(String userId, Collection<String> feedItemIds);
}
