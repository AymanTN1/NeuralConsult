package com.neuralconsult.sevrage.clinical.notes;

import com.neuralconsult.sevrage.common.auditing.AuditableEntity;
import com.neuralconsult.sevrage.patient.PatientProfile;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "clinical_note")
public class ClinicalNote extends AuditableEntity {

  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "patient_profile_id", nullable = false, unique = true)
  private PatientProfile patientProfile;

  @Column(name = "medical_summary", length = 8000, nullable = false)
  private String medicalSummary;

  @Column(name = "complementary_note", length = 4000, nullable = false)
  private String complementaryNote;

  // JSON snapshot of the facts used for generation (auditing / no hallucination traceability).
  @Column(name = "facts_snapshot", length = 12000, nullable = false)
  private String factsSnapshot;

  @Enumerated(EnumType.STRING)
  @Column(name = "validation_status", length = 24, nullable = false)
  private ValidationStatus validationStatus;

  @Column(name = "validation_issues", length = 2000)
  private String validationIssues;

  @Column(name = "model_name", length = 80)
  private String modelName;

  public enum ValidationStatus {
    VALIDATED,
    FAILED
  }
}

