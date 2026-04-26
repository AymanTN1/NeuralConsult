package com.neuralconsult.sevrage.community.dto;

import java.util.UUID;

public record CommunityPostCreateRequest(String content, UUID serverId, String imageUrl) {
}
