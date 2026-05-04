package com.neuralconsult.sevrage.community.dto;

import java.util.UUID;

public record CommunityProfileResponse(
    UUID userId,
    String displayName,
    String username,
    String role,
    String profilePhotoUrl,
    String bio,
    boolean profileCompleted,
    boolean verifiedBadge
) {
}
