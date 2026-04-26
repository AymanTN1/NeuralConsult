package com.neuralconsult.sevrage.appointment.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record DoctorAvailabilityResponse(
    UUID id,
    LocalDate availableDate,
    String dayOfWeek,
    LocalTime startTime,
    LocalTime endTime,
    boolean active
) {
}
