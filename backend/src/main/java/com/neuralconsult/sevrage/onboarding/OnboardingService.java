package com.neuralconsult.sevrage.onboarding;

import com.neuralconsult.sevrage.clinical.intelligence.ClinicalIntelligenceService;
import com.neuralconsult.sevrage.clinical.notes.ClinicalNotesService;
import com.neuralconsult.sevrage.onboarding.dto.OnboardingRequest;
import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileService;
import com.neuralconsult.sevrage.user.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class OnboardingService {

  private static final Logger log = LoggerFactory.getLogger(OnboardingService.class);

  private final OnboardingRepository repository;
  private final PatientProfileService patientProfileService;
  private final ClinicalNotesService clinicalNotesService;
  private final ClinicalIntelligenceService clinicalIntelligenceService;
  private final TransactionTemplate transactionTemplate;

  public OnboardingService(OnboardingRepository repository,
                           PatientProfileService patientProfileService,
                           ClinicalNotesService clinicalNotesService,
                           ClinicalIntelligenceService clinicalIntelligenceService,
                           PlatformTransactionManager transactionManager) {
    this.repository = repository;
    this.patientProfileService = patientProfileService;
    this.clinicalNotesService = clinicalNotesService;
    this.clinicalIntelligenceService = clinicalIntelligenceService;
    this.transactionTemplate = new TransactionTemplate(transactionManager);
  }

  public OnboardingAssessment save(User user, OnboardingRequest request) {
    OnboardingAssessment saved = transactionTemplate.execute(status -> persistOnboarding(user, request));
    if (saved == null) {
      throw new IllegalStateException("Onboarding persistence returned no assessment.");
    }

    safelyGenerateClinicalNotes(user);
    safelyGenerateClinicalIntelligence(user);

    return saved;
  }

  @Transactional
  public OnboardingAssessment get(User user) {
    PatientProfile profile = patientProfileService.getOrCreate(user);
    return repository.findByPatientProfile(profile).orElse(null);
  }

  @Transactional
  protected OnboardingAssessment persistOnboarding(User user, OnboardingRequest request) {
    PatientProfile profile = patientProfileService.getOrCreate(user);
    applyProfile(profile, request);
    if (!profile.isOnboardingComplete()) {
      profile.setOnboardingComplete(true);
    }

    OnboardingAssessment assessment = repository.findByPatientProfile(profile).orElseGet(() -> {
      OnboardingAssessment created = new OnboardingAssessment();
      created.setPatientProfile(profile);
      return created;
    });

    applyAssessment(assessment, request);
    computeDerivedScores(assessment);
    return repository.save(assessment);
  }

  private void applyProfile(PatientProfile profile, OnboardingRequest request) {
    profile.setDateOfBirth(request.dateOfBirth());
    profile.setSex(request.sex());
    profile.setHeightCm(request.heightCm());
    profile.setWeightKg(request.weightKg());
    profile.setCity(request.city());
    profile.setCountryCode(request.countryCode());
    profile.setOccupation(request.occupation());
    profile.setCigarettesPerDay(request.cigarettesPerDay());
    profile.setSmokingStartAge(request.smokingStartAge());
    profile.setMedicalHistoryNotes(request.medicalHistoryNotes());
  }

  private void applyAssessment(OnboardingAssessment assessment, OnboardingRequest request) {
    assessment.setAppointmentLeadDays(request.appointmentLeadDays());
    assessment.setPregnant(request.pregnant());
    assessment.setPregnancyTrimester(request.pregnancyTrimester());
    assessment.setUsesBirthControlPill(request.usesBirthControlPill());
    assessment.setConsultationObjective(request.consultationObjective());
    assessment.setProfessionalStatus(request.professionalStatus());
    assessment.setOtherSmokersAtHome(request.otherSmokersAtHome());
    assessment.setEducationLevel(request.educationLevel());
    assessment.setReferralSource(request.referralSource());
    assessment.setRiskHypertension(request.riskHypertension());
    assessment.setRiskDiabetes(request.riskDiabetes());
    assessment.setRiskHypercholesterolemia(request.riskHypercholesterolemia());
    assessment.setCardiovascularMyocardialInfarction(request.cardiovascularMyocardialInfarction());
    assessment.setCardiovascularAngina(request.cardiovascularAngina());
    assessment.setCardiovascularStroke(request.cardiovascularStroke());
    assessment.setCardiovascularPeripheralArteryDisease(request.cardiovascularPeripheralArteryDisease());
    assessment.setRespiratoryChronicBronchitis(request.respiratoryChronicBronchitis());
    assessment.setRespiratoryCopd(request.respiratoryCopd());
    assessment.setRespiratoryAsthma(request.respiratoryAsthma());
    assessment.setCancerLung(request.cancerLung());
    assessment.setCancerThroat(request.cancerThroat());
    assessment.setCancerBladder(request.cancerBladder());
    assessment.setCancerOther(request.cancerOther());
    assessment.setCancerOtherDetails(request.cancerOtherDetails());
    assessment.setMedicationTranquilizers(request.medicationTranquilizers());
    assessment.setMedicationSleepingPills(request.medicationSleepingPills());
    assessment.setMedicationAntidepressants(request.medicationAntidepressants());
    assessment.setMedicationNeuroleptics(request.medicationNeuroleptics());
    assessment.setMedicationMoodRegulators(request.medicationMoodRegulators());
    assessment.setMedicationSubstitutionTreatment(request.medicationSubstitutionTreatment());
    assessment.setDepressionHistory(request.depressionHistory());
    assessment.setOtherHealthIssues(request.otherHealthIssues());
    assessment.setReducedConsumptionLastMonth(request.reducedConsumptionLastMonth());
    assessment.setCurrentlySmoking(request.currentlySmoking());
    assessment.setQuitDays(request.quitDays());
    assessment.setQuitMonths(request.quitMonths());
    assessment.setCigarettesPerDayBeforeQuit(request.cigarettesPerDayBeforeQuit());
    assessment.setSmokesDaily(request.smokesDaily());
    assessment.setManufacturedCigarettesPerDay(request.manufacturedCigarettesPerDay());
    assessment.setRolledCigarettesPerDay(request.rolledCigarettesPerDay());
    assessment.setCigarillosPerDay(request.cigarillosPerDay());
    assessment.setUsesCigar(request.usesCigar());
    assessment.setUsesPipe(request.usesPipe());
    assessment.setUsesChewingTobacco(request.usesChewingTobacco());
    assessment.setUsesSnus(request.usesSnus());
    assessment.setUsesHookah(request.usesHookah());
    assessment.setUsesPloom(request.usesPloom());
    assessment.setOtherTobaccoDetails(request.otherTobaccoDetails());
    assessment.setUsesECigarette(request.usesECigarette());
    assessment.setEcigWeeklyLiquid(request.ecigWeeklyLiquid());
    assessment.setUsesNicotineCartridges(request.usesNicotineCartridges());
    assessment.setNicotineCartridgeDosage(request.nicotineCartridgeDosage());
    assessment.setWeeklyTobaccoSpend(request.weeklyTobaccoSpend());
    assessment.setIncomeBracket(request.incomeBracket());
    assessment.setEpicesQ49(request.epicesQ49());
    assessment.setEpicesQ50(request.epicesQ50());
    assessment.setEpicesQ51(request.epicesQ51());
    assessment.setEpicesQ52(request.epicesQ52());
    assessment.setEpicesQ53(request.epicesQ53());
    assessment.setEpicesQ54(request.epicesQ54());
    assessment.setEpicesQ55(request.epicesQ55());
    assessment.setEpicesQ56(request.epicesQ56());
    assessment.setEpicesQ57(request.epicesQ57());
    assessment.setEpicesQ58(request.epicesQ58());
    assessment.setEpicesQ59(request.epicesQ59());
    assessment.setQuitAttempts(request.quitAttempts());
    assessment.setLongestQuitDays(request.longestQuitDays());
    assessment.setMotivationStage(request.motivationStage());
    assessment.setMotivationScore(request.motivationScore());
    assessment.setConfidenceScore(request.confidenceScore());
    assessment.setSmokingReasonAutomatic(request.smokingReasonAutomatic());
    assessment.setSmokingReasonConviviality(request.smokingReasonConviviality());
    assessment.setSmokingReasonPleasure(request.smokingReasonPleasure());
    assessment.setSmokingReasonStress(request.smokingReasonStress());
    assessment.setSmokingReasonConcentration(request.smokingReasonConcentration());
    assessment.setSmokingReasonSupportMoral(request.smokingReasonSupportMoral());
    assessment.setSmokingReasonWeight(request.smokingReasonWeight());
    assessment.setSmokesAtHome(request.smokesAtHome());
    assessment.setUsesOtherTobacco(request.usesOtherTobacco());
    assessment.setTriggers(request.triggers());
    assessment.setQuitReasons(request.quitReasons());
    assessment.setQuitFears(request.quitFears());
    assessment.setAlcoholFrequency(request.alcoholFrequency());
    assessment.setAlcoholQuantity(request.alcoholQuantity());
    assessment.setAlcoholBinge(request.alcoholBinge());
    assessment.setNotes(request.notes());

    assessment.setCageCutDown(request.cageCutDown());
    assessment.setCageAnnoyed(request.cageAnnoyed());
    assessment.setCageGuilty(request.cageGuilty());
    assessment.setCageEyeOpener(request.cageEyeOpener());

    assessment.setCannabisLast12Months(request.cannabisLast12Months());
    assessment.setCannabisFrequency(request.cannabisFrequency());
    assessment.setCannabisStartAge(request.cannabisStartAge());

    assessment.setWeightConcernScore(request.weightConcernScore());
    assessment.setWeightConfidenceScore(request.weightConfidenceScore());
    assessment.setPhysicalActivityLevel(request.physicalActivityLevel());

    assessment.setHoncQ1(request.honcQ1());
    assessment.setHoncQ2(request.honcQ2());
    assessment.setHoncQ3(request.honcQ3());
    assessment.setHoncQ4(request.honcQ4());
    assessment.setHoncQ5(request.honcQ5());
    assessment.setHoncQ6(request.honcQ6());
    assessment.setHoncQ7(request.honcQ7());
    assessment.setHoncQ8(request.honcQ8());
    assessment.setHoncQ9(request.honcQ9());
    assessment.setHoncQ10(request.honcQ10());
  }

  private void computeDerivedScores(OnboardingAssessment assessment) {
    int cageScore = countTrue(
        assessment.getCageCutDown(),
        assessment.getCageAnnoyed(),
        assessment.getCageGuilty(),
        assessment.getCageEyeOpener()
    );
    assessment.setCageScore(cageScore);
    assessment.setCagePositive(cageScore >= 2);

    int honcScore = countTrue(
        assessment.getHoncQ1(),
        assessment.getHoncQ2(),
        assessment.getHoncQ3(),
        assessment.getHoncQ4(),
        assessment.getHoncQ5(),
        assessment.getHoncQ6(),
        assessment.getHoncQ7(),
        assessment.getHoncQ8(),
        assessment.getHoncQ9(),
        assessment.getHoncQ10()
    );
    assessment.setHoncScore(honcScore);
    assessment.setHoncHighDependence(honcScore >= 7);

    Integer alcoholFrequency = assessment.getAlcoholFrequency();
    Integer alcoholQuantity = assessment.getAlcoholQuantity();
    Integer alcoholBinge = assessment.getAlcoholBinge();
    if (alcoholFrequency == null && alcoholQuantity == null && alcoholBinge == null) {
      assessment.setAlcoholScore(null);
    } else {
      int alcoholScore = (alcoholFrequency != null ? alcoholFrequency : 0)
          + (alcoholQuantity != null ? alcoholQuantity : 0)
          + (alcoholBinge != null ? alcoholBinge : 0);
      assessment.setAlcoholScore(alcoholScore);
    }

    int epicesScore = countTrue(
        assessment.getEpicesQ49(),
        assessment.getEpicesQ50(),
        assessment.getEpicesQ51(),
        assessment.getEpicesQ52(),
        assessment.getEpicesQ53(),
        assessment.getEpicesQ54(),
        assessment.getEpicesQ55(),
        assessment.getEpicesQ56(),
        assessment.getEpicesQ57(),
        assessment.getEpicesQ58(),
        assessment.getEpicesQ59()
    );
    assessment.setEpicesScore(epicesScore);
  }

  private int countTrue(Boolean... values) {
    int total = 0;
    for (Boolean value : values) {
      if (Boolean.TRUE.equals(value)) {
        total += 1;
      }
    }
    return total;
  }

  private void safelyGenerateClinicalNotes(User user) {
    try {
      clinicalNotesService.generateAndSave(user);
    } catch (RuntimeException exception) {
      log.warn("Clinical notes generation failed after onboarding save for user {}. Keeping onboarding data persisted.",
          user.getEmail(), exception);
    }
  }

  private void safelyGenerateClinicalIntelligence(User user) {
    try {
      clinicalIntelligenceService.generateAndSave(user);
    } catch (RuntimeException exception) {
      log.warn("Clinical intelligence generation failed after onboarding save for user {}. Keeping onboarding data persisted.",
          user.getEmail(), exception);
    }
  }
}
