package com.neuralconsult.sevrage.community.dto;

import java.util.List;

public record CommunitySocialOverviewResponse(
    List<CommunityPostResponse> posts,
    List<CommunityServerResponse> circles,
    List<CommunityUserSummaryResponse> people,
    List<CommunityConnectionResponse> pendingInvitations,
    List<CommunityUserSummaryResponse> friends,
    List<CommunityConversationResponse> conversations
) {
}
