package com.neuralconsult.sevrage.support.dto;

import java.time.Instant;
import java.util.UUID;

public record SupportMessageResponse(
    UUID id,
    String senderType,
    String content,
    String riskLevel,
    boolean requiresDoctorAttention,
    Instant createdAt
) {
}
