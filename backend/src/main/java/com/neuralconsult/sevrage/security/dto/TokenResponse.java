package com.neuralconsult.sevrage.security.dto;

import java.time.Instant;

public record TokenResponse(
    String accessToken,
    Instant expiresAt
) {
}
