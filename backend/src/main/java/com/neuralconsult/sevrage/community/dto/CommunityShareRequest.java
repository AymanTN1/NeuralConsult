package com.neuralconsult.sevrage.community.dto;

import java.util.UUID;

public record CommunityShareRequest(
    UUID counterpartId,
    String message
) {
}
