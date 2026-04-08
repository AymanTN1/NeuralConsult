package com.neuralconsult.sevrage.community.dto;

import java.time.Instant;
import java.util.UUID;

public record CommunityServerResponse(
    UUID id,
    String name,
    String description,
    String visibility,
    String createdBy,
    int memberCount,
    boolean joined,
    String myRole,
    Instant createdAt
) {
}
