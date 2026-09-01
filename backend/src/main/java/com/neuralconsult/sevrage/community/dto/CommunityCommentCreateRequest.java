package com.neuralconsult.sevrage.community.dto;

import java.util.UUID;

public record CommunityCommentCreateRequest(
    String content,
    UUID parentCommentId
) {
}
