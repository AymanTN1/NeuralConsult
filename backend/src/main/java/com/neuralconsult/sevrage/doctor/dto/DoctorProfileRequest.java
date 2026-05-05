package com.neuralconsult.sevrage.doctor.dto;

public record DoctorProfileRequest(
    String city,
    String countryCode,
    String specialty,
    String bio,
    Boolean acceptsTeleconsultation,
    Integer yearsExperience,
    // ── Identification officielle ──────────────────────────────────────────
    String cinNumber,
    String cabinetAddress,
    // ── Identification professionnelle (bouclier juridique) ────────────────
    String cnomNumber,
    String inpeNumber
) {
}
