package com.example.app.registration;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.exception.ApiException;
import com.example.app.registration.document.Enrollment;
import com.example.app.registration.dto.SubgroupItemDto;
import com.example.app.registration.dto.SubgroupListResponse;
import com.example.app.registration.enums.StudentStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class IntakeSubgroupService {

    private final MongoTemplate mongoTemplate;

    public SubgroupListResponse listSubgroups(
            String intakeId,
            String facultyId,
            String degreeProgramId,
            String streamRaw,
            AccountStatus enrollmentStatus) {

        if (intakeId == null || intakeId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Intake id is required");
        }

        List<Criteria> parts = new ArrayList<>();
        parts.add(Criteria.where("intakeId").is(intakeId.trim()));
        if (facultyId != null && !facultyId.isBlank()) {
            parts.add(Criteria.where("facultyId").is(facultyId.trim().toUpperCase(Locale.ROOT)));
        }
        if (degreeProgramId != null && !degreeProgramId.isBlank()) {
            parts.add(Criteria.where("degreeProgramId").is(degreeProgramId.trim()));
        }
        if (streamRaw != null && !streamRaw.isBlank()) {
            StudentStream stream = parseStream(streamRaw);
            parts.add(Criteria.where("stream").is(stream));
        }
        if (enrollmentStatus != null) {
            parts.add(Criteria.where("enrollmentStatus").is(enrollmentStatus));
        }

        Criteria base = new Criteria().andOperator(parts.toArray(new Criteria[0]));

        long total = mongoTemplate.count(Query.query(base), Enrollment.class);

        List<Criteria> withSubgroupParts = new ArrayList<>(parts);
        withSubgroupParts.add(Criteria.where("subgroup").regex(".+"));
        Criteria withSubgroup = new Criteria().andOperator(withSubgroupParts.toArray(new Criteria[0]));

        Aggregation aggregation =
                Aggregation.newAggregation(
                        Aggregation.match(withSubgroup),
                        Aggregation.group("subgroup").count().as("count"),
                        Aggregation.sort(Sort.Direction.ASC, "_id"));

        AggregationResults<Document> results =
                mongoTemplate.aggregate(aggregation, "enrollments", Document.class);

        List<SubgroupItemDto> items = new ArrayList<>();
        for (Document doc : results.getMappedResults()) {
            String code = doc.getString("_id");
            Number n = (Number) doc.get("count");
            long count = n == null ? 0L : n.longValue();
            if (code != null && !code.isBlank()) {
                items.add(SubgroupItemDto.builder().code(code).count(count).build());
            }
        }

        StudentStream streamEnum = null;
        if (streamRaw != null && !streamRaw.isBlank()) {
            streamEnum = parseStream(streamRaw);
        }

        return SubgroupListResponse.builder()
                .intakeId(intakeId.trim())
                .facultyId(facultyId == null ? null : facultyId.trim().toUpperCase(Locale.ROOT))
                .degreeProgramId(degreeProgramId == null ? null : degreeProgramId.trim())
                .stream(streamEnum)
                .total(total)
                .items(items)
                .build();
    }

    private static StudentStream parseStream(String raw) {
        try {
            return StudentStream.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Stream must be WEEKDAY or WEEKEND");
        }
    }
}
