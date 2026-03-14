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

  @Column(name = "appointment_lead_days")
  private Integer appointmentLeadDays;

  @Column(name = "is_pregnant")
  private Boolean pregnant;

  @Column(name = "pregnancy_trimester")
  private Integer pregnancyTrimester;

  @Column(name = "uses_birth_control_pill")
  private Boolean usesBirthControlPill;

  @Enumerated(EnumType.STRING)
  @Column(name = "consultation_objective", length = 32)
  private ConsultationObjective consultationObjective;

  @Enumerated(EnumType.STRING)
  @Column(name = "professional_status", length = 32)
  private ProfessionalStatus professionalStatus;

  @Column(name = "other_smokers_at_home")
  private Boolean otherSmokersAtHome;

  @Enumerated(EnumType.STRING)
  @Column(name = "education_level", length = 32)
  private EducationLevel educationLevel;

  @Enumerated(EnumType.STRING)
  @Column(name = "referral_source", length = 32)
  private ReferralSource referralSource;

  @Column(name = "risk_hypertension")
  private Boolean riskHypertension;

  @Column(name = "risk_diabetes")
  private Boolean riskDiabetes;

  @Column(name = "risk_hypercholesterolemia")
  private Boolean riskHypercholesterolemia;

  @Column(name = "cvd_myocardial_infarction")
  private Boolean cardiovascularMyocardialInfarction;

  @Column(name = "cvd_angina")
  private Boolean cardiovascularAngina;

  @Column(name = "cvd_stroke")
  private Boolean cardiovascularStroke;

  @Column(name = "cvd_peripheral_artery")
  private Boolean cardiovascularPeripheralArteryDisease;

  @Column(name = "resp_chronic_bronchitis")
  private Boolean respiratoryChronicBronchitis;

  @Column(name = "resp_copd")
  private Boolean respiratoryCopd;

  @Column(name = "resp_asthma")
  private Boolean respiratoryAsthma;

  @Column(name = "cancer_lung")
  private Boolean cancerLung;

  @Column(name = "cancer_throat")
  private Boolean cancerThroat;

  @Column(name = "cancer_bladder")
  private Boolean cancerBladder;

  @Column(name = "cancer_other")
  private Boolean cancerOther;

  @Column(name = "cancer_other_details", length = 200)
  private String cancerOtherDetails;

  @Column(name = "med_tranquilizers")
  private Boolean medicationTranquilizers;

  @Column(name = "med_sleeping_pills")
  private Boolean medicationSleepingPills;

  @Column(name = "med_antidepressants")
  private Boolean medicationAntidepressants;

  @Column(name = "med_neuroleptics")
  private Boolean medicationNeuroleptics;

  @Column(name = "med_mood_regulators")
  private Boolean medicationMoodRegulators;

  @Column(name = "med_substitution_treatment")
  private Boolean medicationSubstitutionTreatment;

  @Column(name = "depression_history")
  private Boolean depressionHistory;

  @Column(name = "other_health_issues", length = 2000)
  private String otherHealthIssues;

  @Column(name = "reduced_consumption_last_month")
  private Boolean reducedConsumptionLastMonth;

  @Column(name = "currently_smoking")
  private Boolean currentlySmoking;

  @Column(name = "quit_days")
  private Integer quitDays;

  @Column(name = "quit_months")
  private Integer quitMonths;

  @Column(name = "cigarettes_per_day_before_quit")
  private Integer cigarettesPerDayBeforeQuit;

  @Column(name = "smokes_daily")
  private Boolean smokesDaily;

  @Column(name = "manufactured_cigarettes_per_day")
  private Integer manufacturedCigarettesPerDay;

  @Column(name = "rolled_cigarettes_per_day")
  private Integer rolledCigarettesPerDay;

  @Column(name = "cigarillos_per_day")
  private Integer cigarillosPerDay;

  @Column(name = "uses_cigar")
  private Boolean usesCigar;

  @Column(name = "uses_pipe")
  private Boolean usesPipe;

  @Column(name = "uses_chewing_tobacco")
  private Boolean usesChewingTobacco;

  @Column(name = "uses_snus")
  private Boolean usesSnus;

  @Column(name = "uses_hookah")
  private Boolean usesHookah;

  @Column(name = "uses_ploom")
  private Boolean usesPloom;

  @Column(name = "other_tobacco_details", length = 200)
  private String otherTobaccoDetails;

  @Column(name = "uses_e_cigarette")
  private Boolean usesECigarette;

  @Column(name = "ecig_weekly_liquid", length = 64)
  private String ecigWeeklyLiquid;

  @Column(name = "uses_nicotine_cartridges")
  private Boolean usesNicotineCartridges;

  @Column(name = "nicotine_cartridge_dosage", length = 64)
  private String nicotineCartridgeDosage;

  @Column(name = "weekly_tobacco_spend")
  private Integer weeklyTobaccoSpend;

  @Enumerated(EnumType.STRING)
  @Column(name = "income_bracket", length = 32)
  private IncomeBracket incomeBracket;

  @Column(name = "epices_q49")
  private Boolean epicesQ49;

  @Column(name = "epices_q50")
  private Boolean epicesQ50;

  @Column(name = "epices_q51")
  private Boolean epicesQ51;

  @Column(name = "epices_q52")
  private Boolean epicesQ52;

  @Column(name = "epices_q53")
  private Boolean epicesQ53;

  @Column(name = "epices_q54")
  private Boolean epicesQ54;

  @Column(name = "epices_q55")
  private Boolean epicesQ55;

  @Column(name = "epices_q56")
  private Boolean epicesQ56;

  @Column(name = "epices_q57")
  private Boolean epicesQ57;

  @Column(name = "epices_q58")
  private Boolean epicesQ58;

  @Column(name = "epices_q59")
  private Boolean epicesQ59;

  @Column(name = "epices_score")
  private Integer epicesScore;

  @Column(name = "quit_attempts")
  private Integer quitAttempts;

  @Column(name = "longest_quit_days")
  private Integer longestQuitDays;

  @Column(name = "motivation_stage")
  private Integer motivationStage;

  @Column(name = "motivation_score")
  private Integer motivationScore;

  @Column(name = "confidence_score")
  private Integer confidenceScore;

  @Column(name = "smoking_reason_automatic")
  private Integer smokingReasonAutomatic;

  @Column(name = "smoking_reason_conviviality")
  private Integer smokingReasonConviviality;

  @Column(name = "smoking_reason_pleasure")
  private Integer smokingReasonPleasure;

  @Column(name = "smoking_reason_stress")
  private Integer smokingReasonStress;

  @Column(name = "smoking_reason_concentration")
  private Integer smokingReasonConcentration;

  @Column(name = "smoking_reason_support_moral")
  private Integer smokingReasonSupportMoral;

  @Column(name = "smoking_reason_weight")
  private Integer smokingReasonWeight;

  @Column(name = "smokes_at_home")
  private Boolean smokesAtHome;

  @Column(name = "uses_other_tobacco")
  private Boolean usesOtherTobacco;

  @Column(name = "triggers", length = 500)
  private String triggers;

  @Column(name = "quit_reasons", length = 2000)
  private String quitReasons;

  @Column(name = "quit_fears", length = 2000)
  private String quitFears;

  @Column(name = "alcohol_frequency")
  private Integer alcoholFrequency;

  @Column(name = "alcohol_quantity")
  private Integer alcoholQuantity;

  @Column(name = "alcohol_binge")
  private Integer alcoholBinge;

  @Column(name = "alcohol_score")
  private Integer alcoholScore;

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

  @Column(name = "cannabis_start_age")
  private Integer cannabisStartAge;

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

  public enum ConsultationObjective {
    STOP_COMPLETELY,
    REDUCE,
    INFO,
    MAINTAIN_QUIT
  }

  public enum ProfessionalStatus {
    ACTIVE,
    UNEMPLOYED_RSA,
    STUDENT,
    RETIRED,
    HOMEMAKER,
    DISABILITY
  }

  public enum EducationLevel {
    NO_DIPLOMA,
    SECONDARY,
    CAP_BEP,
    BAC,
    BAC_PLUS_2,
    ABOVE_BAC_PLUS_2
  }

  public enum ReferralSource {
    HOSPITALIZATION,
    ENTOURAGE,
    GP,
    SPECIALIST,
    OCCUPATIONAL_DOCTOR,
    PHARMACIST,
    TABAC_INFO_SERVICE,
    PERSONAL_DECISION
  }

  public enum IncomeBracket {
    BELOW_1000,
    FROM_1001_TO_2000,
    FROM_2001_TO_3000,
    FROM_3001_TO_4000,
    ABOVE_4000
  }
}
