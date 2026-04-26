package com.neuralconsult.sevrage.security.dto;

public record PasswordResetResponse(
    String email,
    boolean codeSent,
    String message
) {
}
