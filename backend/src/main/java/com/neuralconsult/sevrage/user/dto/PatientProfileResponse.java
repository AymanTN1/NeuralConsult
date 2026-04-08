package com.neuralconsult.sevrage.user.dto;

import com.neuralconsult.sevrage.patient.PatientProfile.Sex;
import java.time.LocalDate;

public record PatientProfileResponse(
    LocalDate dateOfBirth,
    Sex sex,
    Integer heightCm,
    Integer weightKg,
    String city,
    String countryCode,
    String occupation,
    Integer cigarettesPerDay,
    Integer smokingStartAge,
    boolean onboardingComplete,
    boolean testsComplete,
    boolean journalComplete,
    String dependenceLevel,
    String medicalHistoryNotes
) {
}
