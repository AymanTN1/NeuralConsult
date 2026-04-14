package com.neuralconsult.sevrage.community.dto;

import java.time.Instant;
import java.util.UUID;

public record CommunityDirectMessageResponse(
    UUID id,
    UUID senderId,
    String senderName,
    String content,
    Instant createdAt,
    boolean mine,
    String status
) {
}
