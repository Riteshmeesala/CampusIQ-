package com.campusiq.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@EnableDiscoveryClient
@ComponentScan(basePackages = {"com.campusiq.auth", "com.campusiq.common"})
public class AuthServiceApplication {
    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(AuthServiceApplication.class, args);
    }

    private static void loadDotEnv() {
        java.io.File[] candidates = new java.io.File[] {
            new java.io.File(".env"),
            new java.io.File("../.env"),
            new java.io.File("../../.env")
        };
        for (java.io.File file : candidates) {
            if (file.exists() && file.isFile()) {
                try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.FileReader(file))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int eqIdx = line.indexOf('=');
                        if (eqIdx > 0) {
                            String key = line.substring(0, eqIdx).trim();
                            String val = line.substring(eqIdx + 1).trim();
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, val);
                            }
                        }
                    }
                    break;
                } catch (Exception ignored) {}
            }
        }
    }
}
