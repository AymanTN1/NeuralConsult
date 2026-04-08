package com.neuralconsult.sevrage.community.dto;

import java.util.UUID;

public record CommunityChannelResponse(
    UUID id,
    String name,
    String description,
    String channelType
) {
}
