package com.neuralconsult.sevrage.support;

import com.neuralconsult.sevrage.support.dto.AiSupportChatRequest;
import com.neuralconsult.sevrage.support.dto.AiSupportChatResponse;
import com.neuralconsult.sevrage.support.dto.AiSupportVoiceChatResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

@Service
public class AiSupportChatClient {

  private final RestTemplate restTemplate;
  private final ObjectMapper objectMapper;
  private final String baseUrl;

  public AiSupportChatClient(RestTemplate restTemplate,
                             ObjectMapper objectMapper,
                             @Value("${ai.service.base-url:http://localhost:8000}") String baseUrl) {
    this.restTemplate = restTemplate;
    this.objectMapper = objectMapper;
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

  public AiSupportVoiceChatResponse respondVoice(AiSupportChatRequest request,
                                                 byte[] audioBytes,
                                                 String filename,
                                                 String contentType,
                                                 Long audioDurationMs) {
    MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
    body.add("audio", buildAudioPart(audioBytes, filename, contentType));
    body.add("requestId", request.requestId());
    body.add("patientFacts", toJson(request.patientFacts()));
    body.add("conversationHistory", toJson(request.conversationHistory()));
    body.add("emergencyMode", String.valueOf(Boolean.TRUE.equals(request.emergencyMode())));
    body.add("preferredLanguage", request.preferredLanguage());
    if (audioDurationMs != null) {
      body.add("audioDurationMs", String.valueOf(audioDurationMs));
    }

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.MULTIPART_FORM_DATA);

    try {
      ResponseEntity<AiSupportVoiceChatResponse> response = restTemplate.postForEntity(
          baseUrl + "/api/support-chat/respond-voice",
          new HttpEntity<>(body, headers),
          AiSupportVoiceChatResponse.class
      );
      return response.getBody();
    } catch (RestClientResponseException exception) {
      String message = extractErrorMessage(exception);
      if (exception.getStatusCode().is4xxClientError()) {
        throw new IllegalArgumentException(message, exception);
      }
      throw new IllegalStateException(message, exception);
    }
  }

  private HttpEntity<ByteArrayResource> buildAudioPart(byte[] audioBytes, String filename, String contentType) {
    ByteArrayResource resource = new ByteArrayResource(audioBytes) {
      @Override
      public String getFilename() {
        return filename != null && !filename.isBlank() ? filename : "support-voice.webm";
      }
    };

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.parseMediaType(
        contentType != null && !contentType.isBlank() ? contentType : "application/octet-stream"
    ));
    return new HttpEntity<>(resource, headers);
  }

  private String toJson(Object value) {
    try {
      return objectMapper.writeValueAsString(value);
    } catch (JsonProcessingException exception) {
      throw new IllegalArgumentException("Impossible de preparer le contexte IA vocal.", exception);
    }
  }

  private String extractErrorMessage(RestClientResponseException exception) {
    String body = exception.getResponseBodyAsString();
    if (body != null && !body.isBlank()) {
      try {
        JsonNode root = objectMapper.readTree(body);
        JsonNode detail = root.get("detail");
        if (detail != null && !detail.isNull()) {
          return detail.isTextual() ? detail.asText() : detail.toString();
        }
        JsonNode message = root.get("message");
        if (message != null && message.isTextual()) {
          return message.asText();
        }
      } catch (Exception ignored) {
        return body;
      }
    }
    return "Analyse vocale indisponible pour le moment.";
  }
}
