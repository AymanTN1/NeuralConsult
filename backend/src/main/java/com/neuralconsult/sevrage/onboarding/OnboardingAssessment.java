package com.neuralconsult.sevrage.onboarding;

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
@Table(name = "onboarding_assessment")
public class OnboardingAssessment extends AuditableEntity {

  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "patient_profile_id", nullable = false, unique = true)
  private PatientProfile patientProfile;

  @Column(name = "quit_attempts")
  private Integer quitAttempts;

  @Column(name = "longest_quit_days")
  private Integer longestQuitDays;

  @Column(name = "motivation_score")
  private Integer motivationScore;

  @Column(name = "confidence_score")
  private Integer confidenceScore;

  @Column(name = "smokes_at_home")
  private Boolean smokesAtHome;

  @Column(name = "uses_other_tobacco")
  private Boolean usesOtherTobacco;

  @Column(name = "triggers", length = 500)
  private String triggers;

  @Column(name = "notes", length = 1000)
  private String notes;

  @Column(name = "cage_cut_down")
  private Boolean cageCutDown;

  @Column(name = "cage_annoyed")
  private Boolean cageAnnoyed;

  @Column(name = "cage_guilty")
  private Boolean cageGuilty;

  @Column(name = "cage_eye_opener")
  private Boolean cageEyeOpener;

  @Column(name = "cage_score")
  private Integer cageScore;

  @Column(name = "cage_positive")
  private Boolean cagePositive;

  @Column(name = "cannabis_last_12_months")
  private Boolean cannabisLast12Months;

  @Enumerated(EnumType.STRING)
  @Column(name = "cannabis_frequency", length = 32)
  private CannabisFrequency cannabisFrequency;

  @Column(name = "weight_concern_score")
  private Integer weightConcernScore;

  @Column(name = "weight_confidence_score")
  private Integer weightConfidenceScore;

  @Enumerated(EnumType.STRING)
  @Column(name = "physical_activity_level", length = 32)
  private PhysicalActivityLevel physicalActivityLevel;

  @Column(name = "honc_q1")
  private Boolean honcQ1;

  @Column(name = "honc_q2")
  private Boolean honcQ2;

  @Column(name = "honc_q3")
  private Boolean honcQ3;

  @Column(name = "honc_q4")
  private Boolean honcQ4;

  @Column(name = "honc_q5")
  private Boolean honcQ5;

  @Column(name = "honc_q6")
  private Boolean honcQ6;

  @Column(name = "honc_q7")
  private Boolean honcQ7;

  @Column(name = "honc_q8")
  private Boolean honcQ8;

  @Column(name = "honc_q9")
  private Boolean honcQ9;

  @Column(name = "honc_q10")
  private Boolean honcQ10;

  @Column(name = "honc_score")
  private Integer honcScore;

  @Column(name = "honc_high_dependence")
  private Boolean honcHighDependence;

  public enum CannabisFrequency {
    NONE,
    LESS_THAN_3,
    THREE_TO_5,
    SIX_TO_9,
    TEN_TO_19,
    TWENTY_TO_29,
    DAILY
  }

  public enum PhysicalActivityLevel {
    NONE,
    LESS_THAN_30_MIN,
    ONE_TO_TWO_HOURS,
    TWO_TO_FOUR_HOURS,
    MORE_THAN_FOUR_HOURS
  }
}
