package com.neuralconsult.sevrage.user.dto;

import java.util.UUID;
import java.util.Set;
import java.time.LocalDate;

public record UserProfileResponse(
    UUID userId,
    String email,
    String fullName,
    String firstName,
    String lastName,
    LocalDate legalDateOfBirth,
    boolean identityVerified,
    PatientProfileResponse profile,
    ScoresResponse scores,
    Set<String> roles
) {
}
