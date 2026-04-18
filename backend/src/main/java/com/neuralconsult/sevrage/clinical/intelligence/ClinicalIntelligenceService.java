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
import com.neuralconsult.sevrage.report.DailyReport;
import com.neuralconsult.sevrage.report.DailyReportRepository;
import com.neuralconsult.sevrage.user.User;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ClinicalIntelligenceService {

  private final PatientProfileService patientProfileService;
  private final OnboardingRepository onboardingRepository;
  private final FagerstromTestRepository fagerstromTestRepository;
  private final HadTestRepository hadTestRepository;
  private final DailyReportRepository dailyReportRepository;
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
      DailyReportRepository dailyReportRepository,
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
    this.dailyReportRepository = dailyReportRepository;
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
    List<FagerstromTest> fagerHistory = fagerstromTestRepository.findAllByPatientProfileOrderByCreatedAtDesc(profile);
    List<HadTest> hadHistory = hadTestRepository.findAllByPatientProfileOrderByCreatedAtDesc(profile);
    List<DailyReport> dailyReports = dailyReportRepository.findAllByPatientProfileAndReportDateBetween(
        profile,
        LocalDate.now().minusDays(30),
        LocalDate.now()
    );

    Map<String, Object> facts = assembleFacts(profile, assessment, latestFager, latestHad, fagerHistory, hadHistory, dailyReports);
    ClinicalIntelligenceAiGenerateResponse ai = requestAiOrFallback(facts);

    Map<Integer, String> existingDoctorNotes = new LinkedHashMap<>();
    aiPhaseSummaryRepository.findAllByPatientProfileOrderByPhaseIdAsc(profile).forEach(existing -> {
      if (existing.getDoctorNote() != null && !existing.getDoctorNote().isBlank()) {
        existingDoctorNotes.put(existing.getPhaseId(), existing.getDoctorNote());
      }
    });

    aiPhaseSummaryRepository.deleteAllByPatientProfile(profile);
    aiPlanCandidateRepository.deleteAllByPatientProfile(profile);

    for (PhaseSummaryAiDto item : ai.phaseSummaries()) {
      AiPhaseSummary summary = new AiPhaseSummary();
      summary.setPatientProfile(profile);
      summary.setPhaseId(item.phaseId());
      summary.setPhaseTitle(item.phaseTitle());
      summary.setSummary(item.summary());
      summary.setDoctorNote(existingDoctorNotes.get(item.phaseId()));
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

  private ClinicalIntelligenceAiGenerateResponse requestAiOrFallback(Map<String, Object> facts) {
    try {
      ClinicalIntelligenceAiGenerateResponse ai = aiClinicalIntelligenceClient.generate(facts);
      if (isUsable(ai)) {
        return ai;
      }
    } catch (RuntimeException ignored) {
      // The clinical dossier must remain usable even if the external AI service is temporarily unavailable.
    }
    return buildLocalClinicalIntelligence(facts);
  }

  private boolean isUsable(ClinicalIntelligenceAiGenerateResponse ai) {
    if (ai == null || ai.globalSummary() == null || isBlank(ai.globalSummary().summary())) {
      return false;
    }
    if (ai.phaseSummaries() == null || ai.phaseSummaries().size() != 5) {
      return false;
    }
    if (ai.planCandidates() == null || ai.planCandidates().size() != 3) {
      return false;
    }
    List<String> tracks = ai.planCandidates().stream()
        .map(AiPlanCandidateDto::track)
        .filter(track -> track != null)
        .sorted()
        .toList();
    return tracks.equals(List.of("BALANCED", "INTENSIVE", "LONG_TERM"));
  }

  private ClinicalIntelligenceAiGenerateResponse buildLocalClinicalIntelligence(Map<String, Object> facts) {
    Map<String, Object> patient = asMap(facts.get("patient_profile"));
    Map<String, Object> onboarding = asMap(facts.get("onboarding_assessment"));
    Map<String, Object> tests = asMap(facts.get("tests"));
    Map<String, Object> history = asMap(facts.get("history"));
    Map<String, Object> fagerstrom = asMap(tests.get("fagerstrom_latest"));
    Map<String, Object> had = asMap(tests.get("had_latest"));
    List<?> dailyReports = history.get("daily_reports") instanceof List<?> items ? items : List.of();

    Integer fagerScore = asInteger(firstNonNull(fagerstrom.get("total_score"), patient.get("fagerstrom_score")));
    Integer anxietyScore = asInteger(firstNonNull(had.get("anxiety_score"), patient.get("had_anxiety_score")));
    Integer depressionScore = asInteger(firstNonNull(had.get("depression_score"), patient.get("had_depression_score")));
    Integer cigarettes = asInteger(patient.get("cigarettes_per_day"));
    Integer honcScore = asInteger(onboarding.get("honc_score"));
    Integer cageScore = asInteger(onboarding.get("cage_score"));
    Integer epicesScore = asInteger(onboarding.get("epices_score"));
    Integer motivationScore = asInteger(onboarding.get("motivation_score"));
    Integer confidenceScore = asInteger(onboarding.get("confidence_score"));

    List<PhaseSummaryAiDto> phaseSummaries = List.of(
        new PhaseSummaryAiDto(
            1,
            "Contexte social et personnel",
            "Le patient evolue dans un contexte " + value(patient.get("city"), "geographique non precise")
                + ", avec " + value(onboarding.get("professional_status"), "un statut professionnel a confirmer")
                + ". L'objectif de consultation et l'entourage tabagique orientent la motivation initiale et les leviers d'accompagnement.",
            attention("Consolider l'objectif de sevrage", "Verifier l'exposition au tabac dans le foyer"),
            missing(patient, onboarding, "date_of_birth", "city", "occupation", "consultation_objective")
        ),
        new PhaseSummaryAiDto(
            2,
            "Risques medicaux et antecedents",
            "Les antecedents cardiovasculaires, respiratoires, cancerologiques et psychiatriques structurent le niveau de prudence clinique. "
                + "Les elements declares doivent etre relus par le medecin avant toute prescription ou intensification du sevrage.",
            attention("Rechercher les comorbidites respiratoires et cardiovasculaires", "Verifier les traitements psychotropes ou substitutifs"),
            missing(onboarding, "risk_hypertension", "risk_diabetes", "respiratory_asthma", "depression_history")
        ),
        new PhaseSummaryAiDto(
            3,
            "Habitudes tabagiques et e-cigarette",
            "La consommation actuelle est estimee a " + value(cigarettes, "un niveau non renseigne")
                + " cigarettes/jour, avec e-cigarette: " + value(onboarding.get("uses_e_cigarette"), "non renseigne")
                + ". Cette phase precise le produit dominant, les arrets precedents et les declencheurs de consommation.",
            attention("Identifier les moments de craving", "Distinguer cigarette, tabac roule, chicha et e-cigarette"),
            missing(patient, onboarding, "cigarettes_per_day", "currently_smoking", "uses_e_cigarette", "triggers")
        ),
        new PhaseSummaryAiDto(
            4,
            "Scorage de dependance",
            "Le Fagerstrom est a " + value(fagerScore, "non renseigne")
                + ", avec HAD anxiete " + value(anxietyScore, "non renseigne")
                + " et HAD depression " + value(depressionScore, "non renseigne")
                + ". Ce bloc objective la dependance physique et le retentissement anxio-depressif utile au choix du plan.",
            attention("Adapter l'intensite NRT au score Fagerstrom", "Surveiller anxiete/depression pendant le sevrage"),
            missing(patient, "fagerstrom_score", "had_anxiety_score", "had_depression_score")
        ),
        new PhaseSummaryAiDto(
            5,
            "Vulnerabilite sociale et co-addictions",
            "Les scores EPICES " + value(epicesScore, "non renseigne")
                + ", CAGE " + value(cageScore, "non renseigne")
                + " et HONC " + value(honcScore, "non renseigne")
                + " aident a reperer les facteurs de maintien de la dependance et les fragilites sociales.",
            attention("Reperer alcool/cannabis et vulnerabilite sociale", "Renforcer le soutien si HONC ou EPICES eleves"),
            missing(onboarding, "epices_score", "cage_score", "honc_score", "alcohol_score")
        )
    );

    List<String> doctorFocus = new ArrayList<>();
    if (fagerScore != null && fagerScore >= 7) {
      doctorFocus.add("Dependance nicotinique elevee: envisager un plan intensif et une substitution combinee.");
    }
    if ((anxietyScore != null && anxietyScore >= 11) || (depressionScore != null && depressionScore >= 11)) {
      doctorFocus.add("HAD eleve: surveiller le risque anxio-depressif pendant le sevrage.");
    }
    if (Boolean.TRUE.equals(onboarding.get("cage_positive"))) {
      doctorFocus.add("CAGE positif: explorer l'alcool avant validation du plan.");
    }
    if (doctorFocus.isEmpty()) {
      doctorFocus.add("Verifier la coherence entre dependance, motivation et contexte social avant validation.");
    }

    String globalText = "Synthese diagnostique IA: patient avec consommation "
        + value(cigarettes, "non renseignee") + " cigarettes/jour, Fagerstrom "
        + value(fagerScore, "non renseigne") + ", HAD anxiete "
        + value(anxietyScore, "non renseigne") + ", HAD depression "
        + value(depressionScore, "non renseigne") + ". Les donnees d'evaluation, de tests et de journal "
        + (dailyReports.isEmpty() ? "ne montrent pas encore de tendance quotidienne exploitable" : "montrent " + dailyReports.size() + " entree(s) recentes pour suivre cravings, stress et cigarettes")
        + ". Le medecin doit confirmer les risques, choisir un seul plan et adapter le suivi selon motivation "
        + value(motivationScore, "non renseignee") + "/10 et confiance "
        + value(confidenceScore, "non renseignee") + "/10.";

    GlobalSummaryAiDto globalSummary = new GlobalSummaryAiDto(
        globalText,
        doctorFocus,
        readinessLine(motivationScore, confidenceScore),
        missing(patient, onboarding, "fagerstrom_score", "had_anxiety_score", "had_depression_score", "notes")
    );

    List<AiPlanCandidateDto> plans = List.of(
        new AiPlanCandidateDto(
            "INTENSIVE",
            "Plan intensif supervise",
            "Approche indiquee si dependance forte, cravings importants ou fragilite psychique/sociale.",
            "Substitution nicotinique combinee a discuter medicalement: patch de fond + forme orale rapide si besoin.",
            "Suivi serre des declencheurs, preparation des situations a risque et plan anti-craving quotidien.",
            "Contact hebdomadaire au debut, puis espacement selon stabilisation.",
            attention("Confirmer contre-indications et tolerance NRT", "Surveiller HAD et rechute precoce"),
            attention("Fixer une date cible", "Demarrer un journal quotidien", "Reevaluer apres 7 jours")
        ),
        new AiPlanCandidateDto(
            "BALANCED",
            "Plan equilibre progressif",
            "Approche adaptee a une dependance moderee ou a un patient motive avec besoin de structure.",
            "Patch ou gommes selon rythme de consommation, a ajuster par le medecin.",
            "Identifier les cigarettes automatiques, remplacer les routines et renforcer le soutien social.",
            "Suivi toutes les 1 a 2 semaines avec adaptation au journal.",
            attention("Verifier adherence", "Adapter si cravings persistants"),
            attention("Lister les declencheurs", "Construire une routine alternative", "Mesurer les scores chaque semaine")
        ),
        new AiPlanCandidateDto(
            "LONG_TERM",
            "Plan long terme motivationnel",
            "Approche utile si le patient a besoin d'une reduction accompagnee ou d'un renforcement motivationnel.",
            "Substitution optionnelle selon evolution, cravings et decision medicale.",
            "Travail sur motivation, confiance, entourage et prevention de rechute.",
            "Suivi mensuel avec points intermediaires si risque detecte.",
            attention("Eviter un rythme trop lent si dependance elevee", "Repasser en intensif si aggravation"),
            attention("Stabiliser les objectifs", "Reduire progressivement", "Reevaluer motivation et confiance")
        )
    );

    return new ClinicalIntelligenceAiGenerateResponse(
        UUID.randomUUID().toString(),
        "local-clinical-fallback",
        phaseSummaries,
        globalSummary,
        plans,
        List.of()
    );
  }

  private Map<String, Object> assembleFacts(PatientProfile profile,
                                            OnboardingAssessment assessment,
                                            FagerstromTest latestFager,
                                            HadTest latestHad,
                                            List<FagerstromTest> fagerHistory,
                                            List<HadTest> hadHistory,
                                            List<DailyReport> dailyReports) {
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
      onboarding.put("appointment_lead_days", assessment.getAppointmentLeadDays());
      onboarding.put("pregnant", assessment.getPregnant());
      onboarding.put("pregnancy_trimester", assessment.getPregnancyTrimester());
      onboarding.put("uses_birth_control_pill", assessment.getUsesBirthControlPill());
      onboarding.put("consultation_objective", assessment.getConsultationObjective() != null ? assessment.getConsultationObjective().name() : null);
      onboarding.put("referral_source", assessment.getReferralSource() != null ? assessment.getReferralSource().name() : null);
      onboarding.put("risk_hypertension", assessment.getRiskHypertension());
      onboarding.put("risk_diabetes", assessment.getRiskDiabetes());
      onboarding.put("risk_hypercholesterolemia", assessment.getRiskHypercholesterolemia());
      onboarding.put("cardiovascular_myocardial_infarction", assessment.getCardiovascularMyocardialInfarction());
      onboarding.put("cardiovascular_angina", assessment.getCardiovascularAngina());
      onboarding.put("cardiovascular_stroke", assessment.getCardiovascularStroke());
      onboarding.put("cardiovascular_peripheral_artery_disease", assessment.getCardiovascularPeripheralArteryDisease());
      onboarding.put("respiratory_chronic_bronchitis", assessment.getRespiratoryChronicBronchitis());
      onboarding.put("respiratory_copd", assessment.getRespiratoryCopd());
      onboarding.put("respiratory_asthma", assessment.getRespiratoryAsthma());
      onboarding.put("cancer_lung", assessment.getCancerLung());
      onboarding.put("cancer_throat", assessment.getCancerThroat());
      onboarding.put("cancer_bladder", assessment.getCancerBladder());
      onboarding.put("cancer_other", assessment.getCancerOther());
      onboarding.put("cancer_other_details", assessment.getCancerOtherDetails());
      onboarding.put("medication_tranquilizers", assessment.getMedicationTranquilizers());
      onboarding.put("medication_sleeping_pills", assessment.getMedicationSleepingPills());
      onboarding.put("medication_antidepressants", assessment.getMedicationAntidepressants());
      onboarding.put("medication_neuroleptics", assessment.getMedicationNeuroleptics());
      onboarding.put("medication_mood_regulators", assessment.getMedicationMoodRegulators());
      onboarding.put("medication_substitution_treatment", assessment.getMedicationSubstitutionTreatment());
      onboarding.put("quit_days", assessment.getQuitDays());
      onboarding.put("quit_months", assessment.getQuitMonths());
      onboarding.put("cigarettes_per_day_before_quit", assessment.getCigarettesPerDayBeforeQuit());
      onboarding.put("smokes_daily", assessment.getSmokesDaily());
      onboarding.put("manufactured_cigarettes_per_day", assessment.getManufacturedCigarettesPerDay());
      onboarding.put("rolled_cigarettes_per_day", assessment.getRolledCigarettesPerDay());
      onboarding.put("cigarillos_per_day", assessment.getCigarillosPerDay());
      onboarding.put("uses_cigar", assessment.getUsesCigar());
      onboarding.put("uses_pipe", assessment.getUsesPipe());
      onboarding.put("uses_chewing_tobacco", assessment.getUsesChewingTobacco());
      onboarding.put("uses_snus", assessment.getUsesSnus());
      onboarding.put("uses_hookah", assessment.getUsesHookah());
      onboarding.put("uses_ploom", assessment.getUsesPloom());
      onboarding.put("other_tobacco_details", assessment.getOtherTobaccoDetails());
      onboarding.put("ecig_weekly_liquid", assessment.getEcigWeeklyLiquid());
      onboarding.put("uses_nicotine_cartridges", assessment.getUsesNicotineCartridges());
      onboarding.put("nicotine_cartridge_dosage", assessment.getNicotineCartridgeDosage());
      onboarding.put("epices_q49", assessment.getEpicesQ49());
      onboarding.put("epices_q50", assessment.getEpicesQ50());
      onboarding.put("epices_q51", assessment.getEpicesQ51());
      onboarding.put("epices_q52", assessment.getEpicesQ52());
      onboarding.put("epices_q53", assessment.getEpicesQ53());
      onboarding.put("epices_q54", assessment.getEpicesQ54());
      onboarding.put("epices_q55", assessment.getEpicesQ55());
      onboarding.put("epices_q56", assessment.getEpicesQ56());
      onboarding.put("epices_q57", assessment.getEpicesQ57());
      onboarding.put("epices_q58", assessment.getEpicesQ58());
      onboarding.put("epices_q59", assessment.getEpicesQ59());
      onboarding.put("quit_attempts", assessment.getQuitAttempts());
      onboarding.put("longest_quit_days", assessment.getLongestQuitDays());
      onboarding.put("smoking_reason_automatic", assessment.getSmokingReasonAutomatic());
      onboarding.put("smoking_reason_conviviality", assessment.getSmokingReasonConviviality());
      onboarding.put("smoking_reason_pleasure", assessment.getSmokingReasonPleasure());
      onboarding.put("smoking_reason_stress", assessment.getSmokingReasonStress());
      onboarding.put("smoking_reason_concentration", assessment.getSmokingReasonConcentration());
      onboarding.put("smoking_reason_support_moral", assessment.getSmokingReasonSupportMoral());
      onboarding.put("smoking_reason_weight", assessment.getSmokingReasonWeight());
      onboarding.put("uses_other_tobacco", assessment.getUsesOtherTobacco());
      onboarding.put("triggers", assessment.getTriggers());
      onboarding.put("alcohol_frequency", assessment.getAlcoholFrequency());
      onboarding.put("alcohol_quantity", assessment.getAlcoholQuantity());
      onboarding.put("alcohol_binge", assessment.getAlcoholBinge());
      onboarding.put("cage_cut_down", assessment.getCageCutDown());
      onboarding.put("cage_annoyed", assessment.getCageAnnoyed());
      onboarding.put("cage_guilty", assessment.getCageGuilty());
      onboarding.put("cage_eye_opener", assessment.getCageEyeOpener());
      onboarding.put("cannabis_last_12_months", assessment.getCannabisLast12Months());
      onboarding.put("cannabis_frequency", assessment.getCannabisFrequency() != null ? assessment.getCannabisFrequency().name() : null);
      onboarding.put("cannabis_start_age", assessment.getCannabisStartAge());
      onboarding.put("weight_concern_score", assessment.getWeightConcernScore());
      onboarding.put("weight_confidence_score", assessment.getWeightConfidenceScore());
      onboarding.put("physical_activity_level", assessment.getPhysicalActivityLevel() != null ? assessment.getPhysicalActivityLevel().name() : null);
      onboarding.put("honc_q1", assessment.getHoncQ1());
      onboarding.put("honc_q2", assessment.getHoncQ2());
      onboarding.put("honc_q3", assessment.getHoncQ3());
      onboarding.put("honc_q4", assessment.getHoncQ4());
      onboarding.put("honc_q5", assessment.getHoncQ5());
      onboarding.put("honc_q6", assessment.getHoncQ6());
      onboarding.put("honc_q7", assessment.getHoncQ7());
      onboarding.put("honc_q8", assessment.getHoncQ8());
      onboarding.put("honc_q9", assessment.getHoncQ9());
      onboarding.put("honc_q10", assessment.getHoncQ10());
      onboarding.put("notes", assessment.getNotes());
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

    Map<String, Object> history = new LinkedHashMap<>();
    history.put("fagerstrom_history", fagerHistory.stream().limit(10).map(item -> {
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("created_at", item.getCreatedAt());
      row.put("total_score", item.getTotalScore());
      row.put("dependence_level", item.getDependenceLevel() != null ? item.getDependenceLevel().name() : null);
      return row;
    }).toList());
    history.put("had_history", hadHistory.stream().limit(10).map(item -> {
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("created_at", item.getCreatedAt());
      row.put("anxiety_score", item.getAnxietyScore());
      row.put("depression_score", item.getDepressionScore());
      row.put("anxiety_interpretation", item.getAnxietyInterpretation() != null ? item.getAnxietyInterpretation().name() : null);
      row.put("depression_interpretation", item.getDepressionInterpretation() != null ? item.getDepressionInterpretation().name() : null);
      return row;
    }).toList());
    history.put("daily_reports", dailyReports.stream().map(item -> {
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("report_date", item.getReportDate());
      row.put("cigarettes_smoked", item.getCigarettesSmoked());
      row.put("cravings_intensity", item.getCravingsIntensity());
      row.put("mood_score", item.getMoodScore());
      row.put("stress_score", item.getStressScore());
      row.put("used_nrt", item.getUsedNrt());
      row.put("relapse_event", item.getRelapseEvent());
      row.put("notes", item.getNotes());
      return row;
    }).toList());
    root.put("history", history);
    return root;
  }

  @Transactional
  public AiPhaseSummary updateDoctorPhaseNote(PatientProfile patientProfile, java.util.UUID phaseSummaryId, String doctorNote) {
    AiPhaseSummary summary = aiPhaseSummaryRepository.findById(phaseSummaryId).orElseThrow();
    if (!summary.getPatientProfile().getId().equals(patientProfile.getId())) {
      throw new IllegalArgumentException("Phase summary does not belong to this patient.");
    }
    summary.setDoctorNote(doctorNote);
    return aiPhaseSummaryRepository.save(summary);
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

  @SuppressWarnings("unchecked")
  private Map<String, Object> asMap(Object value) {
    if (value instanceof Map<?, ?> map) {
      return (Map<String, Object>) map;
    }
    return Map.of();
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }

  private Object firstNonNull(Object first, Object second) {
    return first != null ? first : second;
  }

  private Integer asInteger(Object value) {
    if (value instanceof Integer integer) {
      return integer;
    }
    if (value instanceof Number number) {
      return number.intValue();
    }
    if (value instanceof String text && !text.isBlank()) {
      try {
        return Integer.parseInt(text);
      } catch (NumberFormatException ignored) {
        return null;
      }
    }
    return null;
  }

  private String value(Object value, String fallback) {
    if (value == null) {
      return fallback;
    }
    if (value instanceof String text) {
      return text.isBlank() ? fallback : text;
    }
    return String.valueOf(value);
  }

  private List<String> attention(String... items) {
    return List.of(items);
  }

  private List<String> missing(Map<String, Object> values, String... keys) {
    List<String> missing = new ArrayList<>();
    for (String key : keys) {
      Object value = values.get(key);
      if (value == null || (value instanceof String text && text.isBlank())) {
        missing.add(key);
      }
    }
    return missing;
  }

  private List<String> missing(Map<String, Object> first, Map<String, Object> second, String... keys) {
    List<String> missing = new ArrayList<>();
    for (String key : keys) {
      Object value = first.containsKey(key) ? first.get(key) : second.get(key);
      if (value == null || (value instanceof String text && text.isBlank())) {
        missing.add(key);
      }
    }
    return missing;
  }

  private String readinessLine(Integer motivationScore, Integer confidenceScore) {
    if (motivationScore == null && confidenceScore == null) {
      return "Readiness a preciser: motivation et confiance non renseignees.";
    }
    int motivation = motivationScore != null ? motivationScore : 0;
    int confidence = confidenceScore != null ? confidenceScore : 0;
    if (motivation >= 7 && confidence >= 7) {
      return "Readiness favorable: motivation et confiance elevees, possibilite de plan structure.";
    }
    if (motivation >= 7) {
      return "Motivation presente mais confiance a renforcer avant objectifs trop ambitieux.";
    }
    return "Readiness fragile: renforcer l'alliance, clarifier les objectifs et travailler les freins.";
  }

  public record ClinicalIntelligenceSnapshot(
      List<AiPhaseSummary> phaseSummaries,
      AiGlobalSummary globalSummary,
      List<AiPlanCandidate> planCandidates,
      ValidatedTreatmentPlan validatedPlan
  ) {
  }
}
