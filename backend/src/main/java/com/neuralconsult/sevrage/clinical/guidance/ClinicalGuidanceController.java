package com.neuralconsult.sevrage.clinical.guidance;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import java.util.Map;

@RestController
@RequestMapping("/api/clinical-guidance")
public class ClinicalGuidanceController {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public ClinicalGuidanceController(
            RestTemplate restTemplate,
            @Value("${ai.service.base-url:http://localhost:8000}") String baseUrl
    ) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    /** Legacy simple search endpoint */
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
    public ResponseEntity<Object> searchGuidelines(@RequestParam("q") String q) {
        try {
            ResponseEntity<Object> response = restTemplate.getForEntity(
                baseUrl + "/api/clinical-guidance/search?q={q}",
                Object.class,
                q
            );
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** New conversational RAG chat endpoint */
    @PostMapping("/rag/chat")
    @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
    public ResponseEntity<Object> ragChat(@RequestBody Object payload) {
        try {
            ResponseEntity<Object> response = restTemplate.postForEntity(
                baseUrl + "/api/clinical-rag/chat",
                payload,
                Object.class
            );
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
