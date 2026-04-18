package com.example.app.registration;

import com.example.app.registration.document.SequenceCounter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SequenceCounterService {

    private final MongoTemplate mongoTemplate;

    public long next(String key) {
        Query query = Query.query(Criteria.where("_id").is(key));
        Update update = new Update().inc("value", 1L);
        FindAndModifyOptions options = new FindAndModifyOptions().returnNew(true).upsert(true);
        SequenceCounter counter =
                mongoTemplate.findAndModify(query, update, options, SequenceCounter.class, "sequence_counters");
        if (counter == null) {
            return 1L;
        }
        return counter.getValue();
    }
}
