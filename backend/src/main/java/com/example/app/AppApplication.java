package com.example.app;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AppApplication {

    public static void main(String[] args) {
        loadEnvironmentFile();
        SpringApplication.run(AppApplication.class, args);
    }

    private static void loadEnvironmentFile() {
        Path currentDirectory = Paths.get("").toAbsolutePath().normalize();
        List<Path> candidates = List.of(
                currentDirectory.resolve(".env"),
                currentDirectory.resolve("backend").resolve(".env"),
                currentDirectory.resolve("..").resolve(".env").normalize(),
                currentDirectory.resolve("..").resolve("backend").resolve(".env").normalize()
        );

        for (Path candidate : candidates) {
            if (!Files.exists(candidate)) {
                continue;
            }

            try {
                for (String line : Files.readAllLines(candidate)) {
                    String trimmedLine = line.trim();

                    if (trimmedLine.isBlank() || trimmedLine.startsWith("#")) {
                        continue;
                    }

                    int separatorIndex = trimmedLine.indexOf('=');

                    if (separatorIndex <= 0) {
                        continue;
                    }

                    String key = trimmedLine.substring(0, separatorIndex).trim();
                    String value = trimmedLine.substring(separatorIndex + 1).trim();

                    if ((value.startsWith("\"") && value.endsWith("\""))
                            || (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.substring(1, value.length() - 1);
                    }

                    if (!key.isBlank()
                            && System.getenv(key) == null
                            && System.getProperty(key) == null) {
                        System.setProperty(key, value);
                    }
                }

                return;
            } catch (IOException ignored) {
                return;
            }
        }
    }
}
