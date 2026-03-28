package com.neuralconsult.sevrage.clinical.notes;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neuralconsult.sevrage.clinical.notes.dto.ClinicalNotesAiGenerateRequest;
import com.neuralconsult.sevrage.clinical.notes.dto.ClinicalNotesAiGenerateResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

@Service
public class AiClinicalNotesClient {

  private final RestTemplate restTemplate;
  private final ObjectMapper objectMapper;
  private final String baseUrl;

  public AiClinicalNotesClient(RestTemplate restTemplate,
                               ObjectMapper objectMapper,
                               @Value("${ai.service.base-url:http://localhost:8000}") String baseUrl) {
    this.restTemplate = restTemplate;
    this.objectMapper = objectMapper;
    this.baseUrl = baseUrl;
  }

  public ClinicalNotesAiGenerateResponse generate(Map<String, Object> facts) {
    String requestId = UUID.randomUUID().toString();
    ClinicalNotesAiGenerateRequest request = new ClinicalNotesAiGenerateRequest(requestId, facts);

    try {
      ResponseEntity<ClinicalNotesAiGenerateResponse> response = restTemplate.postForEntity(
          baseUrl + "/api/clinical-notes/generate",
          request,
          ClinicalNotesAiGenerateResponse.class
      );
      return response.getBody();
    } catch (HttpStatusCodeException ex) {
      if (ex.getStatusCode().value() == 422) {
        throw new ClinicalNotesGenerationException(
            "AI notes generation blocked by quality gate.",
            extractIssues(ex.getResponseBodyAsString())
        );
      }
      throw ex;
    }
  }

  private List<String> extractIssues(String body) {
    List<String> issues = new ArrayList<>();
    try {
      JsonNode root = objectMapper.readTree(body);
      JsonNode detail = root.get("detail");
      if (detail != null) {
        JsonNode validation = detail.get("validation");
        if (validation != null) {
          JsonNode issueArr = validation.get("issues");
          if (issueArr != null && issueArr.isArray()) {
            for (JsonNode issue : issueArr) {
              issues.add(issue.asText());
            }
          }
        }
      }
    } catch (Exception ignored) {
      // Fall back to a generic message if parsing fails.
    }
    if (issues.isEmpty()) {
      issues.add("Unprocessable AI response (see AI service logs for details).");
    }
    return issues;
  }
}

