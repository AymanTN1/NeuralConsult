package com.neuralconsult.sevrage.doctor.dto;

import java.time.Instant;
import java.util.UUID;

public record PatientDoctorAssociationResponse(
    UUID doctorProfileId,
    String doctorName,
    String doctorEmail,
    String specialty,
    String city,
    String countryCode,
    boolean acceptsTeleconsultation,
    Integer yearsExperience,
    Integer successScore,
    Instant assignedAt
) {
}
