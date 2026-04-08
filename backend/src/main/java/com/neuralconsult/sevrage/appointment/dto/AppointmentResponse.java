package com.neuralconsult.sevrage.appointment.dto;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record AppointmentResponse(
    UUID id,
    UUID patientProfileId,
    String patientName,
    UUID doctorProfileId,
    String doctorName,
    LocalDateTime startsAt,
    Integer durationMinutes,
    String status,
    String reason,
    String doctorNote,
    boolean triggeredByAiAlert,
    Instant createdAt,
    Instant updatedAt
) {
}
