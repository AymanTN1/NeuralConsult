package com.neuralconsult.sevrage.notification.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
    UUID id,
    String type,
    String title,
    String content,
    String actionPath,
    String actionLabel,
    String status,
    Instant createdAt,
    Instant readAt
) {
}
