package com.neuralconsult.sevrage.doctor.dto;

import java.util.UUID;

public record DoctorProfileResponse(
    UUID id,
    UUID userId,
    String fullName,
    String email,
    String city,
    String countryCode,
    String specialty,
    String bio,
    boolean acceptsTeleconsultation,
    Integer yearsExperience,
    Integer successScore,
    boolean active,
    String accountStatus,
    String matchingMode,
    Integer matchingScore,
    // ── Identification officielle ──────────────────────────────────────────
    String cinNumber,
    String cabinetAddress,
    // ── Identification professionnelle ─────────────────────────────────────
    String cnomNumber,
    String inpeNumber,
    // ── Documents de vérification ──────────────────────────────────────────
    boolean professionalCardUploaded,
    boolean cinCopyUploaded,
    boolean documentsVerified
) {
}
