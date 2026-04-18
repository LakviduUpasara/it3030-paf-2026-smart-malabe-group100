package com.example.app.registration.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "sequence_counters")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SequenceCounter {

    @Id
    private String id;

    private long value;

    @Version
    private Long version;
}
