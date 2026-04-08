package com.neuralconsult.sevrage.community.dto;

import java.util.List;

public record CommunityDetailResponse(
    CommunityServerResponse server,
    List<CommunityChannelResponse> channels,
    List<CommunityMessageResponse> latestMessages
) {
}
