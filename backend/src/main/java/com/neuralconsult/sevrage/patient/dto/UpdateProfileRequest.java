package com.neuralconsult.sevrage.patient.dto;

import com.neuralconsult.sevrage.patient.PatientProfile.Sex;
import java.time.LocalDate;

public record UpdateProfileRequest(
    LocalDate dateOfBirth,
    Sex sex,
    Integer heightCm,
    Integer weightKg,
    String city,
    String countryCode,
    String occupation,
    Integer cigarettesPerDay,
    Integer smokingStartAge,
    String medicalHistoryNotes
) {
}
