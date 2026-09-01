package com.neuralconsult.sevrage.community.dto;

import java.util.UUID;

public record CommunityPostCreateRequest(
    String title,
    String flair,
    String content,
    String imageUrl,
    UUID serverId,
    String postType,
    String sourceUrl,
    String sourceLabel,
    UUID repostOfPostId,
    String repostComment
) {
}
