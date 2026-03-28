package com.neuralconsult.sevrage.clinical.notes.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record ClinicalNotesAiValidationResult(
    @JsonProperty("is_valid") boolean isValid,
    @JsonProperty("issues") List<String> issues
) {
}

