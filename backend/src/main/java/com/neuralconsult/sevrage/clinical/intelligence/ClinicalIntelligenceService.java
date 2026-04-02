package com.neuralconsult.sevrage.clinical.intelligence;

import com.neuralconsult.sevrage.clinical.intelligence.dto.AiPlanCandidateDto;
import com.neuralconsult.sevrage.clinical.intelligence.dto.ClinicalIntelligenceAiGenerateResponse;
import com.neuralconsult.sevrage.clinical.intelligence.dto.GlobalSummaryAiDto;
import com.neuralconsult.sevrage.clinical.intelligence.dto.PhaseSummaryAiDto;
import com.neuralconsult.sevrage.doctor.DoctorProfile;
import com.neuralconsult.sevrage.medical.tests.FagerstromTest;
import com.neuralconsult.sevrage.medical.tests.FagerstromTestRepository;
import com.neuralconsult.sevrage.medical.tests.HadTest;
import com.neuralconsult.sevrage.medical.tests.HadTestRepository;
import com.neuralconsult.sevrage.onboarding.OnboardingAssessment;
import com.neuralconsult.sevrage.onboarding.OnboardingRepository;
import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileService;
import com.neuralconsult.sevrage.user.User;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class ClinicalIntelligenceService {

  private final PatientProfileService patientProfileService;
  private final OnboardingRepository onboardingRepository;
  private final FagerstromTestRepository fagerstromTestRepository;
  private final HadTestRepository hadTestRepository;
  private final AiClinicalIntelligenceClient aiClinicalIntelligenceClient;
  private final AiPhaseSummaryRepository aiPhaseSummaryRepository;
  private final AiGlobalSummaryRepository aiGlobalSummaryRepository;
  private final AiPlanCandidateRepository aiPlanCandidateRepository;
  private final ValidatedTreatmentPlanRepository validatedTreatmentPlanRepository;

  public ClinicalIntelligenceService(
      PatientProfileService patientProfileService,
      OnboardingRepository onboardingRepository,
      FagerstromTestRepository fagerstromTestRepository,
      HadTestRepository hadTestRepository,
      AiClinicalIntelligenceClient aiClinicalIntelligenceClient,
      AiPhaseSummaryRepository aiPhaseSummaryRepository,
      AiGlobalSummaryRepository aiGlobalSummaryRepository,
      AiPlanCandidateRepository aiPlanCandidateRepository,
      ValidatedTreatmentPlanRepository validatedTreatmentPlanRepository
  ) {
    this.patientProfileService = patientProfileService;
    this.onboardingRepository = onboardingRepository;
    this.fagerstromTestRepository = fagerstromTestRepository;
    this.hadTestRepository = hadTestRepository;
    this.aiClinicalIntelligenceClient = aiClinicalIntelligenceClient;
    this.aiPhaseSummaryRepository = aiPhaseSummaryRepository;
    this.aiGlobalSummaryRepository = aiGlobalSummaryRepository;
    this.aiPlanCandidateRepository = aiPlanCandidateRepository;
    this.validatedTreatmentPlanRepository = validatedTreatmentPlanRepository;
  }

  @Transactional
  public ClinicalIntelligenceSnapshot generateAndSave(User user) {
    PatientProfile profile = patientProfileService.getOrCreate(user);
    OnboardingAssessment assessment = onboardingRepository.findByPatientProfile(profile).orElse(null);
    FagerstromTest latestFager = fagerstromTestRepository.findFirstByPatientProfileOrderByCreatedAtDesc(profile).orElse(null);
    HadTest latestHad = hadTestRepository.findFirstByPatientProfileOrderByCreatedAtDesc(profile).orElse(null);

    Map<String, Object> facts = assembleFacts(profile, assessment, latestFager, latestHad);
    ClinicalIntelligenceAiGenerateResponse ai = aiClinicalIntelligenceClient.generate(facts);

    aiPhaseSummaryRepository.deleteAllByPatientProfile(profile);
    aiPlanCandidateRepository.deleteAllByPatientProfile(profile);

    for (PhaseSummaryAiDto item : ai.phaseSummaries()) {
      AiPhaseSummary summary = new AiPhaseSummary();
      summary.setPatientProfile(profile);
      summary.setPhaseId(item.phaseId());
      summary.setPhaseTitle(item.phaseTitle());
      summary.setSummary(item.summary());
      summary.setAttentionPoints(item.attentionPoints() != null ? item.attentionPoints() : List.of());
      summary.setMissingInformation(item.missingInformation() != null ? item.missingInformation() : List.of());
      summary.setModelName(ai.modelName());
      aiPhaseSummaryRepository.save(summary);
    }

    GlobalSummaryAiDto global = ai.globalSummary();
    AiGlobalSummary globalSummary = aiGlobalSummaryRepository.findByPatientProfile(profile).orElseGet(AiGlobalSummary::new);
    globalSummary.setPatientProfile(profile);
    globalSummary.setSummary(global.summary());
    globalSummary.setDoctorFocusPoints(global.doctorFocusPoints() != null ? global.doctorFocusPoints() : List.of());
    globalSummary.setPatientReadiness(global.patientReadiness());
    globalSummary.setMissingInformation(global.missingInformation() != null ? global.missingInformation() : List.of());
    globalSummary.setModelName(ai.modelName());
    aiGlobalSummaryRepository.save(globalSummary);

    for (AiPlanCandidateDto item : ai.planCandidates()) {
      AiPlanCandidate candidate = new AiPlanCandidate();
      candidate.setPatientProfile(profile);
      candidate.setTrack(AiPlanCandidate.Track.valueOf(item.track()));
      candidate.setTitle(item.title());
      candidate.setRationale(item.rationale());
      candidate.setNrtRecommendation(item.nrtRecommendation());
      candidate.setBehavioralFocus(item.behavioralFocus());
      candidate.setFollowUpPlan(item.followUpPlan());
      candidate.setDoctorWarnings(item.doctorWarnings() != null ? item.doctorWarnings() : List.of());
      candidate.setSteps(item.steps() != null ? item.steps() : List.of());
      candidate.setModelName(ai.modelName());
      aiPlanCandidateRepository.save(candidate);
    }

    return getCurrent(user).orElseThrow();
  }

  @Transactional
  public Optional<ClinicalIntelligenceSnapshot> getCurrent(User user) {
    PatientProfile profile = patientProfileService.getOrCreate(user);
    List<AiPhaseSummary> phases = aiPhaseSummaryRepository.findAllByPatientProfileOrderByPhaseIdAsc(profile);
    Optional<AiGlobalSummary> global = aiGlobalSummaryRepository.findByPatientProfile(profile);
    List<AiPlanCandidate> candidates = aiPlanCandidateRepository.findAllByPatientProfileOrderByTrackAsc(profile);
    Optional<ValidatedTreatmentPlan> validated = validatedTreatmentPlanRepository.findByPatientProfile(profile);

    if (phases.isEmpty() && global.isEmpty() && candidates.isEmpty() && validated.isEmpty()) {
      return Optional.empty();
    }
    return Optional.of(new ClinicalIntelligenceSnapshot(phases, global.orElse(null), candidates, validated.orElse(null)));
  }

  private Map<String, Object> assembleFacts(PatientProfile profile,
                                            OnboardingAssessment assessment,
                                            FagerstromTest latestFager,
                                            HadTest latestHad) {
    Map<String, Object> root = new LinkedHashMap<>();

    Map<String, Object> patient = new LinkedHashMap<>();
    patient.put("date_of_birth", profile.getDateOfBirth());
    patient.put("sex", profile.getSex() != null ? profile.getSex().name() : null);
    patient.put("height_cm", profile.getHeightCm());
    patient.put("weight_kg", profile.getWeightKg());
    patient.put("city", profile.getCity());
    patient.put("country_code", profile.getCountryCode());
    patient.put("occupation", profile.getOccupation());
    patient.put("cigarettes_per_day", profile.getCigarettesPerDay());
    patient.put("smoking_start_age", profile.getSmokingStartAge());
    patient.put("fagerstrom_score", profile.getFagerstromScore());
    patient.put("had_anxiety_score", profile.getHadAnxietyScore());
    patient.put("had_depression_score", profile.getHadDepressionScore());
    patient.put("dependence_level", profile.getDependenceLevel() != null ? profile.getDependenceLevel().name() : null);
    patient.put("medical_history_notes", profile.getMedicalHistoryNotes());
    root.put("patient_profile", patient);

    Map<String, Object> onboarding = new LinkedHashMap<>();
    if (assessment != null) {
      onboarding.put("currently_smoking", assessment.getCurrentlySmoking());
      onboarding.put("reduced_consumption_last_month", assessment.getReducedConsumptionLastMonth());
      onboarding.put("weekly_tobacco_spend", assessment.getWeeklyTobaccoSpend());
      onboarding.put("income_bracket", assessment.getIncomeBracket() != null ? assessment.getIncomeBracket().name() : null);
      onboarding.put("epices_score", assessment.getEpicesScore());
      onboarding.put("depression_history", assessment.getDepressionHistory());
      onboarding.put("other_health_issues", assessment.getOtherHealthIssues());
      onboarding.put("uses_e_cigarette", assessment.getUsesECigarette());
      onboarding.put("professional_status", assessment.getProfessionalStatus() != null ? assessment.getProfessionalStatus().name() : null);
      onboarding.put("education_level", assessment.getEducationLevel() != null ? assessment.getEducationLevel().name() : null);
      onboarding.put("other_smokers_at_home", assessment.getOtherSmokersAtHome());
      onboarding.put("smokes_at_home", assessment.getSmokesAtHome());
      onboarding.put("alcohol_score", assessment.getAlcoholScore());
      onboarding.put("cage_score", assessment.getCageScore());
      onboarding.put("cage_positive", assessment.getCagePositive());
      onboarding.put("honc_score", assessment.getHoncScore());
      onboarding.put("honc_high_dependence", assessment.getHoncHighDependence());
      onboarding.put("motivation_stage", assessment.getMotivationStage());
      onboarding.put("motivation_score", assessment.getMotivationScore());
      onboarding.put("confidence_score", assessment.getConfidenceScore());
      onboarding.put("quit_reasons", assessment.getQuitReasons());
      onboarding.put("quit_fears", assessment.getQuitFears());
    }
    root.put("onboarding_assessment", onboarding);

    Map<String, Object> tests = new LinkedHashMap<>();
    if (latestFager != null) {
      Map<String, Object> f = new LinkedHashMap<>();
      f.put("total_score", latestFager.getTotalScore());
      f.put("dependence_level", latestFager.getDependenceLevel());
      tests.put("fagerstrom_latest", f);
    }
    if (latestHad != null) {
      Map<String, Object> h = new LinkedHashMap<>();
      h.put("anxiety_score", latestHad.getAnxietyScore());
      h.put("depression_score", latestHad.getDepressionScore());
      h.put("anxiety_interpretation", latestHad.getAnxietyInterpretation());
      h.put("depression_interpretation", latestHad.getDepressionInterpretation());
      tests.put("had_latest", h);
    }
    root.put("tests", tests);
    return root;
  }

  @Transactional
  public ValidatedTreatmentPlan validateCandidate(
      User doctorUser,
      DoctorProfile doctorProfile,
      PatientProfile patientProfile,
      AiPlanCandidate candidate,
      String doctorNote
  ) {
    ValidatedTreatmentPlan plan = validatedTreatmentPlanRepository.findByPatientProfile(patientProfile)
        .orElseGet(ValidatedTreatmentPlan::new);
    plan.setPatientProfile(patientProfile);
    plan.setDoctorProfile(doctorProfile);
    plan.setSourceCandidate(candidate);
    plan.setTrack(candidate.getTrack());
    plan.setTitle(candidate.getTitle());
    plan.setSummary(candidate.getRationale());
    plan.setNrtRecommendation(candidate.getNrtRecommendation());
    plan.setBehavioralFocus(candidate.getBehavioralFocus());
    plan.setFollowUpPlan(candidate.getFollowUpPlan());
    plan.setDoctorNote(doctorNote);
    plan.setSteps(candidate.getSteps());
    plan.setValidatedAt(Instant.now());
    return validatedTreatmentPlanRepository.save(plan);
  }

  public record ClinicalIntelligenceSnapshot(
      List<AiPhaseSummary> phaseSummaries,
      AiGlobalSummary globalSummary,
      List<AiPlanCandidate> planCandidates,
      ValidatedTreatmentPlan validatedPlan
  ) {
  }
}
