package com.neuralconsult.sevrage.community.dto;

import java.time.Instant;
import java.util.UUID;

public record CommunityActivityItemResponse(
    UUID id,
    String type,
    CommunityUserSummaryResponse actor,
    UUID postId,
    String postPreview,
    String content,
    Instant createdAt
) {
}
