package com.neuralconsult.sevrage.community.dto;

import java.util.List;

public record CommunityUserProfileResponse(
    CommunityUserSummaryResponse user,
    String bio,
    long followingCount,
    long friendsCount,
    List<CommunityPostResponse> posts
) {
}
