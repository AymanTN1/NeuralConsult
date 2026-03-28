package com.neuralconsult.sevrage.clinical.notes;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neuralconsult.sevrage.clinical.notes.dto.ClinicalNotesAiGenerateResponse;
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
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class ClinicalNotesService {

  private final ClinicalNoteRepository repository;
  private final PatientProfileService patientProfileService;
  private final OnboardingRepository onboardingRepository;
  private final FagerstromTestRepository fagerstromTestRepository;
  private final HadTestRepository hadTestRepository;
  private final AiClinicalNotesClient aiClinicalNotesClient;
  private final ObjectMapper objectMapper;

  public ClinicalNotesService(ClinicalNoteRepository repository,
                              PatientProfileService patientProfileService,
                              OnboardingRepository onboardingRepository,
                              FagerstromTestRepository fagerstromTestRepository,
                              HadTestRepository hadTestRepository,
                              AiClinicalNotesClient aiClinicalNotesClient,
                              ObjectMapper objectMapper) {
    this.repository = repository;
    this.patientProfileService = patientProfileService;
    this.onboardingRepository = onboardingRepository;
    this.fagerstromTestRepository = fagerstromTestRepository;
    this.hadTestRepository = hadTestRepository;
    this.aiClinicalNotesClient = aiClinicalNotesClient;
    this.objectMapper = objectMapper;
  }

  public Optional<ClinicalNote> get(User user) {
    PatientProfile profile = patientProfileService.getOrCreate(user);
    return repository.findByPatientProfile(profile);
  }

  /**
   * Generate clinical notes using the AI service and store them only if they pass validation.
   *
   * Security invariant:
   * - If AI validation fails, we DO NOT persist generated content.
   */
  @Transactional
  public ClinicalNote generateAndSave(User user) {
    PatientProfile profile = patientProfileService.getOrCreate(user);

    OnboardingAssessment assessment = onboardingRepository.findByPatientProfile(profile).orElse(null);
    FagerstromTest latestFager = fagerstromTestRepository.findFirstByPatientProfileOrderByCreatedAtDesc(profile).orElse(null);
    HadTest latestHad = hadTestRepository.findFirstByPatientProfileOrderByCreatedAtDesc(profile).orElse(null);

    Map<String, Object> facts = assembleFacts(profile, assessment, latestFager, latestHad);

    ClinicalNotesAiGenerateResponse ai = aiClinicalNotesClient.generate(facts);
    if (ai == null || ai.validation() == null || !ai.validation().isValid()) {
      throw new ClinicalNotesGenerationException(
          "AI notes generation failed validation.",
          ai != null && ai.validation() != null ? ai.validation().issues() : java.util.List.of("Empty AI response")
      );
    }

    ClinicalNote note = repository.findByPatientProfile(profile).orElseGet(ClinicalNote::new);
    note.setPatientProfile(profile);
    note.setMedicalSummary(ai.medicalSummary());
    note.setComplementaryNote(ai.complementaryNote());
    note.setValidationStatus(ClinicalNote.ValidationStatus.VALIDATED);
    note.setValidationIssues(null);
    note.setModelName(ai.modelName());
    note.setFactsSnapshot(toJson(facts));

    return repository.save(note);
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
    }
    root.put("onboarding_assessment", onboarding);

    Map<String, Object> tests = new LinkedHashMap<>();
    if (latestFager != null) {
      Map<String, Object> f = new LinkedHashMap<>();
      f.put("total_score", latestFager.getTotalScore());
      f.put("dependence_level", latestFager.getDependenceLevel());
      f.put("time_to_first_cigarette", latestFager.getTimeToFirstCigarette());
      f.put("cigarettes_per_day", latestFager.getCigarettesPerDay());
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

  private String toJson(Map<String, Object> facts) {
    try {
      return objectMapper.writeValueAsString(facts);
    } catch (JsonProcessingException e) {
      // If serialization fails, block persistence: we lose traceability.
      throw new IllegalStateException("Unable to serialize facts snapshot to JSON.", e);
    }
  }
}

