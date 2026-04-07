package com.neuralconsult.sevrage.security.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RegisterRequest(
    @Email @NotBlank String email,
    @NotBlank String password,
    @NotBlank String fullName,
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
