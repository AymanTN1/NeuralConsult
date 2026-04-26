package com.neuralconsult.sevrage.community.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record CommunityPostResponse(
    UUID id,
    CommunityUserSummaryResponse author,
    UUID serverId,
    String serverName,
    String content,
    String imageUrl,
    Instant createdAt,
    Map<String, Long> reactions,
    String myReaction,
    List<CommunityCommentResponse> comments
) {
}
