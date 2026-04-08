package com.neuralconsult.sevrage.community.dto;

import java.time.Instant;
import java.util.UUID;

public record CommunityMessageResponse(
    UUID id,
    UUID channelId,
    String authorName,
    String content,
    Instant createdAt
) {
}
