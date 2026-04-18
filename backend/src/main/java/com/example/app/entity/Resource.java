package com.example.app.entity;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "resources")
public class Resource {

    @Id
    private String id;

    private String name;
    private ResourceType type;
    private Integer capacity;
    private String location;
    private ResourceStatus status;

    @Builder.Default
    private List<AvailabilityWindow> availabilityWindows = new ArrayList<>();
}
