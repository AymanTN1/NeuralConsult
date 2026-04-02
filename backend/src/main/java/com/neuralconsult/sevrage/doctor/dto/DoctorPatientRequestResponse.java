package com.neuralconsult.sevrage.doctor.dto;

import java.time.Instant;
import java.util.UUID;

public record DoctorPatientRequestResponse(
    UUID id,
    String status,
    String matchingMode,
    Integer matchingScore,
    String patientMessage,
    String doctorResponseNote,
    Instant answeredAt,
    Instant createdAt,
    UUID doctorProfileId,
    String doctorName,
    UUID patientProfileId,
    String patientName
) {
}
