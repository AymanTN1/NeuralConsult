package com.neuralconsult.sevrage.community.dto;

import java.time.Instant;
import java.util.UUID;

public record CommunityConversationResponse(
    UUID counterpartId,
    String counterpartName,
    String counterpartRole,
    String lastMessage,
    Instant lastMessageAt,
    boolean lastMessageMine,
    String lastMessageStatus,
    long unreadCount
) {
}
