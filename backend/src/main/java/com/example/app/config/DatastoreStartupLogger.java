package com.example.app.config;

import java.net.URI;
import java.util.Arrays;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.Environment;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

/**
 * Safe startup diagnostics (no credentials logged).
 */
@Component
@Slf4j
public class DatastoreStartupLogger implements ApplicationListener<ApplicationReadyEvent> {

    @Override
    public void onApplicationEvent(@NonNull ApplicationReadyEvent event) {
        Environment env = event.getApplicationContext().getEnvironment();
        String[] profiles = env.getActiveProfiles();
        log.info("Active Spring profile(s): {}", profiles.length > 0 ? Arrays.toString(profiles) : "(default)");

        String uri = env.getProperty("spring.data.mongodb.uri", "");
        if (uri == null || uri.isBlank()) {
            log.warn("spring.data.mongodb.uri is not set; using Spring Boot defaults");
            return;
        }
        String dbName = extractDbName(uri);
        log.info("MongoDB: configured (database name from URI: {})", dbName != null ? dbName : "unknown");
    }

    private static String extractDbName(String uri) {
        try {
            String s = uri.trim();
            int q = s.indexOf('?');
            if (q >= 0) {
                s = s.substring(0, q);
            }
            int slash = s.lastIndexOf('/');
            if (slash >= 0 && slash < s.length() - 1) {
                return s.substring(slash + 1);
            }
            URI u = URI.create(s.replace("mongodb+srv://", "https://"));
            String path = u.getPath();
            if (path != null && path.length() > 1) {
                return path.substring(1);
            }
        } catch (RuntimeException ignored) {
            // ignore parse issues; do not log raw URI
        }
        return null;
    }
}
