package com.neuralconsult.sevrage.appointment.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AvailableAppointmentSlotResponse(
    UUID doctorProfileId,
    String doctorName,
    LocalDateTime startsAt,
    LocalDateTime endsAt
) {
}
