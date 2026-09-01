package com.neuralconsult.sevrage.community.dto;

import java.time.Instant;
import java.util.UUID;

public record CommunityConnectionResponse(
    UUID id,
    CommunityUserSummaryResponse requester,
    CommunityUserSummaryResponse receiver,
    String status,
    Instant createdAt
) {
}
