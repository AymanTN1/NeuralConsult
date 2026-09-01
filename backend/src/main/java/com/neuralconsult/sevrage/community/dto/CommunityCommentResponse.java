package com.neuralconsult.sevrage.community.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record CommunityCommentResponse(
    UUID id,
    UUID authorId,
    String authorName,
    String authorUsername,
    String authorPhotoUrl,
    String authorRole,
    boolean authorVerifiedBadge,
    String content,
    Instant createdAt,
    UUID parentCommentId,
    Map<String, Long> reactions,
    String myReaction,
    long upvotesCount
) {
}
