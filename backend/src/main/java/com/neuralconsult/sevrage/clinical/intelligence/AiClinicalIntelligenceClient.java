package com.neuralconsult.sevrage.clinical.intelligence;

import com.neuralconsult.sevrage.clinical.intelligence.dto.ClinicalIntelligenceAiGenerateRequest;
import com.neuralconsult.sevrage.clinical.intelligence.dto.ClinicalIntelligenceAiGenerateResponse;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AiClinicalIntelligenceClient {

  private final RestTemplate restTemplate;
  private final String baseUrl;

  public AiClinicalIntelligenceClient(
      RestTemplate restTemplate,
      @Value("${ai.service.base-url:http://localhost:8000}") String baseUrl
  ) {
    this.restTemplate = restTemplate;
    this.baseUrl = baseUrl;
  }

  public ClinicalIntelligenceAiGenerateResponse generate(Map<String, Object> facts) {
    ClinicalIntelligenceAiGenerateRequest request =
        new ClinicalIntelligenceAiGenerateRequest(UUID.randomUUID().toString(), facts);
    ResponseEntity<ClinicalIntelligenceAiGenerateResponse> response = restTemplate.postForEntity(
        baseUrl + "/api/clinical-intelligence/generate",
        request,
        ClinicalIntelligenceAiGenerateResponse.class
    );
    return response.getBody();
  }
}
