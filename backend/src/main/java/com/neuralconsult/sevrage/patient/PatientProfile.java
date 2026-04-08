package com.neuralconsult.sevrage.patient;

import com.neuralconsult.sevrage.common.auditing.AuditableEntity;
import com.neuralconsult.sevrage.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "patient_profile")
public class PatientProfile extends AuditableEntity {

  @OneToOne(fetch = FetchType.EAGER, optional = false)
  @JoinColumn(name = "user_id", nullable = false, unique = true)
  private User user;

  @Column(name = "date_of_birth")
  private LocalDate dateOfBirth;

  @Enumerated(EnumType.STRING)
  @Column(name = "sex", length = 16)
  private Sex sex;

  @Column(name = "height_cm")
  private Integer heightCm;

  @Column(name = "weight_kg")
  private Integer weightKg;

  @Column(name = "city", length = 80)
  private String city;

  @Column(name = "country_code", length = 64)
  private String countryCode;

  @Column(name = "occupation", length = 80)
  private String occupation;

  @Column(name = "cigarettes_per_day")
  private Integer cigarettesPerDay;

  @Column(name = "smoking_start_age")
  private Integer smokingStartAge;

  @Column(name = "fagerstrom_score")
  private Integer fagerstromScore;

  @Column(name = "had_anxiety_score")
  private Integer hadAnxietyScore;

  @Column(name = "had_depression_score")
  private Integer hadDepressionScore;

  @Enumerated(EnumType.STRING)
  @Column(name = "dependence_level", length = 24)
  private DependenceLevel dependenceLevel;

  @Column(name = "medical_history_notes", length = 1000)
  private String medicalHistoryNotes;

  @Column(name = "is_onboarding_complete", nullable = false)
  private boolean onboardingComplete;

  @Column(name = "are_tests_complete")
  private boolean testsComplete;

  @Column(name = "is_journal_complete")
  private boolean journalComplete;

  public enum Sex {
    FEMALE,
    MALE,
    OTHER
  }

  public enum DependenceLevel {
    NONE,
    LOW,
    MODERATE,
    HIGH,
    VERY_HIGH
  }
}
