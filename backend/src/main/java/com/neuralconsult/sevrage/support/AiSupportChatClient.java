package com.neuralconsult.sevrage.support;

import com.neuralconsult.sevrage.support.dto.AiSupportChatRequest;
import com.neuralconsult.sevrage.support.dto.AiSupportChatResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AiSupportChatClient {

  private final RestTemplate restTemplate;
  private final String baseUrl;

  public AiSupportChatClient(RestTemplate restTemplate,
                             @Value("${ai.service.base-url:http://localhost:8000}") String baseUrl) {
    this.restTemplate = restTemplate;
    this.baseUrl = baseUrl;
  }

  public AiSupportChatResponse respond(AiSupportChatRequest request) {
    ResponseEntity<AiSupportChatResponse> response = restTemplate.postForEntity(
        baseUrl + "/api/support-chat/respond",
        request,
        AiSupportChatResponse.class
    );
    return response.getBody();
  }
}
