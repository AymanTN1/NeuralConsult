package com.neuralconsult.sevrage.security.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record IdentityVerificationRequest(
    @NotBlank String documentType,
    String extractedFirstName,
    String extractedLastName,
    LocalDate extractedDateOfBirth,
    @NotBlank String rawText,
    Integer confidence
) {
}
