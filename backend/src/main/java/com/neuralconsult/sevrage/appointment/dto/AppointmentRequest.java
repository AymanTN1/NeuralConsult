package com.neuralconsult.sevrage.appointment.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AppointmentRequest(
    UUID doctorProfileId,
    LocalDateTime startsAt,
    String reason,
    Boolean triggeredByAiAlert
) {
}
