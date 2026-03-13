package com.neuralconsult.sevrage.user.dto;

import java.util.UUID;

public record UserProfileResponse(
    UUID userId,
    String email,
    String fullName,
    PatientProfileResponse profile,
    ScoresResponse scores
) {
}
