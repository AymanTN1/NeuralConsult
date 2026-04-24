package com.neuralconsult.sevrage.security.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record EmailOnlyRequest(
    @Email @NotBlank String email
) {
}
