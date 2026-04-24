package com.neuralconsult.sevrage.security.dto;

public record EmailVerificationResponse(
    String email,
    boolean verificationRequired,
    String message
) {
}
