package com.neuralconsult.sevrage.community.dto;

import java.util.List;

public record CommunitySocialOverviewResponse(
    CommunityProfileResponse viewer,
    List<CommunityPostResponse> posts,
    List<CommunityServerResponse> servers,
    List<CommunityUserSummaryResponse> people,
    List<CommunityConnectionResponse> pendingInvitations,
    List<CommunityUserSummaryResponse> friends,
    List<CommunityConversationResponse> conversations,
    List<CommunityActivityItemResponse> activity
) {
}
