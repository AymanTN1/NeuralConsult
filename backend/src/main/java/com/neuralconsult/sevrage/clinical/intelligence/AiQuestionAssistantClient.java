package com.neuralconsult.sevrage.clinical.intelligence;

import com.neuralconsult.sevrage.clinical.intelligence.dto.QuestionAssistantAiRequest;
import com.neuralconsult.sevrage.clinical.intelligence.dto.QuestionAssistantAiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AiQuestionAssistantClient {

  private final RestTemplate restTemplate;
  private final String baseUrl;

  public AiQuestionAssistantClient(
      RestTemplate restTemplate,
      @Value("${ai.service.base-url:http://localhost:8000}") String baseUrl
  ) {
    this.restTemplate = restTemplate;
    this.baseUrl = baseUrl;
  }

  public QuestionAssistantAiResponse assist(QuestionAssistantAiRequest request) {
    ResponseEntity<QuestionAssistantAiResponse> response = restTemplate.postForEntity(
        baseUrl + "/api/question-assistant/assist",
        request,
        QuestionAssistantAiResponse.class
    );
    return response.getBody();
  }
}
