package com.neuralconsult.sevrage.support.dto;

import java.time.Instant;
import java.util.UUID;

public record DoctorAlertResponse(
    UUID id,
    UUID patientProfileId,
    String patientName,
    String level,
    String title,
    String summary,
    String status,
    Instant createdAt,
    Instant acknowledgedAt
) {
}
