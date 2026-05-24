package com.neuralconsult.sevrage.support.dto;

import java.time.Instant;
import java.util.UUID;

public record SupportMessageResponse(
    UUID id,
    String senderType,
    String content,
    String inputMode,
    String riskLevel,
    Integer voiceStressScore,
    String voiceStressLevel,
    String voiceStressSummary,
    Long audioDurationMs,
    boolean requiresDoctorAttention,
    Instant createdAt
) {
}
