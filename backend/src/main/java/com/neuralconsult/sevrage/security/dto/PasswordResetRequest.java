package com.neuralconsult.sevrage.security.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordResetRequest(
    @Email @NotBlank String email,
    @NotBlank String code,
    @NotBlank @Size(min = 8, max = 128) String newPassword
) {
}
