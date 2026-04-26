package com.neuralconsult.sevrage.security.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.Valid;
import java.time.LocalDate;

public record RegisterRequest(
    @Email @NotBlank String email,
    @NotBlank String password,
    @NotBlank String fullName,
    @NotBlank String firstName,
    @NotBlank String lastName,
    @NotNull LocalDate dateOfBirth,
    @Valid @NotNull IdentityVerificationRequest identityVerification,
    String accountType,
    String phoneNumber,
    String city,
    String countryCode,
    String specialty,
    String bio,
    Boolean acceptsTeleconsultation,
    Integer yearsExperience
) {
}
