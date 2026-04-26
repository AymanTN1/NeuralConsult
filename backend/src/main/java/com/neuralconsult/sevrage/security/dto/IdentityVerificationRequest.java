package com.neuralconsult.sevrage.security.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record IdentityVerificationRequest(
    @NotBlank String documentType,
    @NotBlank String extractedFirstName,
    @NotBlank String extractedLastName,
    @NotNull LocalDate extractedDateOfBirth,
    @NotBlank String rawText,
    Integer confidence
) {
}
