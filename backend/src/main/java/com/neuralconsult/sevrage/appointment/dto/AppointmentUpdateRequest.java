package com.neuralconsult.sevrage.appointment.dto;

import java.time.LocalDateTime;

public record AppointmentUpdateRequest(
    LocalDateTime startsAt,
    String reason,
    String doctorNote
) {
}
