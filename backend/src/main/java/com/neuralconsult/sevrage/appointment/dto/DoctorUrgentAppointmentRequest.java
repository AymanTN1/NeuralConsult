package com.neuralconsult.sevrage.appointment.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record DoctorUrgentAppointmentRequest(
    UUID patientProfileId,
    LocalDateTime startsAt,
    String reason,
    Boolean triggeredByAiAlert
) {
}
