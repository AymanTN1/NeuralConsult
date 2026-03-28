package com.neuralconsult.sevrage.clinical.notes.dto;

import java.time.Instant;

public record ClinicalNoteResponse(
    String medicalSummary,
    String complementaryNote,
    String validationStatus,
    String modelName,
    Instant updatedAt
) {
}
