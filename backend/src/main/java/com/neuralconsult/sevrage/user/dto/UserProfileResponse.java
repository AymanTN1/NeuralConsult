package com.neuralconsult.sevrage.user.dto;

import java.util.UUID;
import java.util.Set;

public record UserProfileResponse(
    UUID userId,
    String email,
    String fullName,
    PatientProfileResponse profile,
    ScoresResponse scores,
    Set<String> roles
) {
}
