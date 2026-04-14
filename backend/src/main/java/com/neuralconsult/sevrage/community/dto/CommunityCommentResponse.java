package com.neuralconsult.sevrage.community.dto;

import java.time.Instant;
import java.util.UUID;

public record CommunityCommentResponse(
    UUID id,
    UUID authorId,
    String authorName,
    String authorRole,
    String content,
    Instant createdAt
) {
}
