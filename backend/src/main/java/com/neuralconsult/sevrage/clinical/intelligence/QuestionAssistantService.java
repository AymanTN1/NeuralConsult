package com.neuralconsult.sevrage.clinical.intelligence;

import com.neuralconsult.sevrage.clinical.intelligence.dto.QuestionAssistantAiRequest;
import com.neuralconsult.sevrage.clinical.intelligence.dto.QuestionAssistantAiResponse;
import com.neuralconsult.sevrage.clinical.intelligence.dto.QuestionAssistantRequest;
import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileService;
import com.neuralconsult.sevrage.user.User;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class QuestionAssistantService {

  private final PatientProfileService patientProfileService;
  private final AiQuestionAssistantClient aiQuestionAssistantClient;

  public QuestionAssistantService(PatientProfileService patientProfileService,
                                  AiQuestionAssistantClient aiQuestionAssistantClient) {
    this.patientProfileService = patientProfileService;
    this.aiQuestionAssistantClient = aiQuestionAssistantClient;
  }

  public QuestionAssistantAiResponse assist(User user, QuestionAssistantRequest request) {
    PatientProfile profile = patientProfileService.getOrCreate(user);
    Map<String, Object> facts = new LinkedHashMap<>();
    facts.put("city", profile.getCity());
    facts.put("country_code", profile.getCountryCode());
    facts.put("sex", profile.getSex() != null ? profile.getSex().name() : null);
    facts.put("cigarettes_per_day", profile.getCigarettesPerDay());
    facts.put("smoking_start_age", profile.getSmokingStartAge());
    if (request.patientFacts() != null) {
      facts.putAll(request.patientFacts());
    }

    return aiQuestionAssistantClient.assist(
        new QuestionAssistantAiRequest(
            request.phaseId(),
            request.phaseLabel(),
            request.questionId(),
            request.questionLabel(),
            request.questionContext(),
            request.patientMessage(),
            request.conversationHistory(),
            request.currentAnswer(),
            request.officialChoices(),
            facts
        )
    );
  }
}
