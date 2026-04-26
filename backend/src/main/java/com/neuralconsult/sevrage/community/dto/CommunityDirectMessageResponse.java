package com.neuralconsult.sevrage.community.dto;

import java.time.Instant;
import java.util.UUID;

public record CommunityDirectMessageResponse(
    UUID id,
    UUID senderId,
    String senderName,
    String senderUsername,
    String senderPhotoUrl,
    String content,
    UUID sharedPostId,
    String sharedPostPreview,
    String sharedPostImageUrl,
    String sharedPostAuthorName,
    Instant createdAt,
    boolean mine,
    String status
) {
}
