package com.neuralconsult.sevrage.medical.tests;

import com.neuralconsult.sevrage.common.auditing.AuditableEntity;
import com.neuralconsult.sevrage.medical.scoring.dto.FagerstromRequest;
import com.neuralconsult.sevrage.medical.scoring.dto.FagerstromResult;
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
@Table(name = "fagerstrom_test")
public class FagerstromTest extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "patient_profile_id", nullable = false)
  private PatientProfile patientProfile;

  @Enumerated(EnumType.STRING)
  @Column(name = "time_to_first_cigarette", length = 24, nullable = false)
  private FagerstromRequest.TimeToFirstCigarette timeToFirstCigarette;

  @Column(name = "difficult_to_refrain", nullable = false)
  private boolean difficultToRefrain;

  @Enumerated(EnumType.STRING)
  @Column(name = "most_difficult_cigarette", length = 24, nullable = false)
  private FagerstromRequest.MostDifficultCigarette mostDifficultCigarette;

  @Enumerated(EnumType.STRING)
  @Column(name = "cigarettes_per_day", length = 24, nullable = false)
  private FagerstromRequest.CigarettesPerDay cigarettesPerDay;

  @Column(name = "smoke_more_in_morning", nullable = false)
  private boolean smokeMoreInMorning;

  @Column(name = "smoke_when_ill", nullable = false)
  private boolean smokeWhenIll;

  @Column(name = "total_score", nullable = false)
  private int totalScore;

  @Enumerated(EnumType.STRING)
  @Column(name = "dependence_level", length = 16, nullable = false)
  private FagerstromResult.DependenceLevel dependenceLevel;
}
