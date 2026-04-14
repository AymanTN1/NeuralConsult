package com.neuralconsult.sevrage.community.dto;

import java.util.UUID;

public record CommunityUserSummaryResponse(
    UUID id,
    String name,
    String email,
    String role,
    boolean following,
    String connectionStatus,
    long followersCount
) {
}
