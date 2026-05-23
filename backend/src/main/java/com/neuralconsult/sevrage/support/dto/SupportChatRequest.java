package com.neuralconsult.sevrage.support.dto;

public record SupportChatRequest(String message, Boolean emergencyMode, String preferredLanguage) {
}
