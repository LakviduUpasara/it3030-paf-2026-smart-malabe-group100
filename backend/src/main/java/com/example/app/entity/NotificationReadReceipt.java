package com.example.app.entity;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "notification_read_receipts")
@CompoundIndex(name = "user_feed_item", def = "{'userId': 1, 'feedItemId': 1}", unique = true)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationReadReceipt {

    @Id
    private String id;

    private String userId;

    private String feedItemId;

    private Instant readAt;
}
