package com.neuralconsult.sevrage.doctor.dto;

import java.util.UUID;

public record DoctorProfileResponse(
    UUID id,
    UUID userId,
    String fullName,
    String email,
    String city,
    String countryCode,
    String specialty,
    String bio,
    boolean acceptsTeleconsultation,
    Integer yearsExperience,
    Integer successScore,
    boolean active,
    String matchingMode,
    Integer matchingScore
) {
}
