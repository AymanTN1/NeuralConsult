package com.neuralconsult.sevrage.community.dto;

import java.util.UUID;

public record CommunityUserSummaryResponse(
    UUID id,
    String name,
    String username,
    String email,
    String role,
    String profilePhotoUrl,
    String bio,
    boolean following,
    String connectionStatus,
    long followersCount,
    long followingCount,
    long postsCount,
    long karmaScore,
    String smokeFreeStatus,
    boolean verifiedBadge,
    boolean isDoctor
) {
}
