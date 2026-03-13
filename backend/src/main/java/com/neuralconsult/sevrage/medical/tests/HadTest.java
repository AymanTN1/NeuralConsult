package com.neuralconsult.sevrage.medical.tests;

import com.neuralconsult.sevrage.common.auditing.AuditableEntity;
import com.neuralconsult.sevrage.medical.scoring.dto.HadResult;
import com.neuralconsult.sevrage.patient.PatientProfile;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "had_test")
public class HadTest extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "patient_profile_id", nullable = false)
  private PatientProfile patientProfile;

  @Column(name = "q1", nullable = false)
  private int q1;

  @Column(name = "q2", nullable = false)
  private int q2;

  @Column(name = "q3", nullable = false)
  private int q3;

  @Column(name = "q4", nullable = false)
  private int q4;

  @Column(name = "q5", nullable = false)
  private int q5;

  @Column(name = "q6", nullable = false)
  private int q6;

  @Column(name = "q7", nullable = false)
  private int q7;

  @Column(name = "q8", nullable = false)
  private int q8;

  @Column(name = "q9", nullable = false)
  private int q9;

  @Column(name = "q10", nullable = false)
  private int q10;

  @Column(name = "q11", nullable = false)
  private int q11;

  @Column(name = "q12", nullable = false)
  private int q12;

  @Column(name = "q13", nullable = false)
  private int q13;

  @Column(name = "q14", nullable = false)
  private int q14;

  @Column(name = "anxiety_score", nullable = false)
  private int anxietyScore;

  @Column(name = "depression_score", nullable = false)
  private int depressionScore;

  @Enumerated(EnumType.STRING)
  @Column(name = "anxiety_interpretation", length = 24, nullable = false)
  private HadResult.Interpretation anxietyInterpretation;

  @Enumerated(EnumType.STRING)
  @Column(name = "depression_interpretation", length = 24, nullable = false)
  private HadResult.Interpretation depressionInterpretation;
}
