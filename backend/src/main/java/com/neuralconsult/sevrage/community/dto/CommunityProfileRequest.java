package com.neuralconsult.sevrage.community.dto;

public record CommunityProfileRequest(
    String username,
    String profilePhotoUrl,
    String bio
) {
}
