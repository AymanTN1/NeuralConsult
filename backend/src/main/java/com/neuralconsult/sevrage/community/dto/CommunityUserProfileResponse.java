package com.neuralconsult.sevrage.community.dto;

import java.util.List;

public record CommunityUserProfileResponse(
    CommunityUserSummaryResponse user,
    String bio,
    long followingCount,
    long followersCount,
    long friendsCount,
    long karmaScore,
    String smokeFreeStatus,
    List<CommunityPostResponse> posts
) {
}
