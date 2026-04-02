package com.neuralconsult.sevrage.clinical.intelligence.dto;

import java.util.List;
import java.util.Map;

public record QuestionAssistantAiRequest(
    Integer phaseId,
    String phaseLabel,
    String questionId,
    String questionLabel,
    String questionContext,
    String patientMessage,
    List<Map<String, String>> conversationHistory,
    Object currentAnswer,
    List<AiChoiceOption> officialChoices,
    Map<String, Object> patientFacts
) {
}
