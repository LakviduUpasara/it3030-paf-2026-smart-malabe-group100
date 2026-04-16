package com.example.app.notifications.document;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "portal_data")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortalDataEntry {

    @Id
    private String key;

    /** JSON payload as string. */
    private String json;

    private Instant updatedAt;
}
