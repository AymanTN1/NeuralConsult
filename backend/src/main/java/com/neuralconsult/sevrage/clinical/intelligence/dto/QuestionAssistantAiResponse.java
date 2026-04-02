package com.neuralconsult.sevrage.clinical.intelligence.dto;

import java.util.List;
import java.util.Map;

public record QuestionAssistantAiResponse(
    String explanation,
    List<String> clarifyingQuestions,
    String suggestedChoiceValue,
    String suggestedChoiceLabel,
    String suggestionReason,
    boolean needsPatientConfirmation,
    String safetyNote,
    String engine,
    String engineWarning,
    List<Map<String, String>> references
) {
}
