package com.neuralconsult.sevrage.onboarding;

import com.neuralconsult.sevrage.onboarding.dto.OnboardingAssessmentResponse;
import com.neuralconsult.sevrage.onboarding.dto.OnboardingRequest;
import com.neuralconsult.sevrage.onboarding.dto.OnboardingResponse;
import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileService;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import com.neuralconsult.sevrage.user.dto.PatientProfileResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/onboarding")
public class OnboardingController {

  private final OnboardingService onboardingService;
  private final UserRepository userRepository;
  private final PatientProfileService patientProfileService;

  public OnboardingController(OnboardingService onboardingService,
                              UserRepository userRepository,
                              PatientProfileService patientProfileService) {
    this.onboardingService = onboardingService;
    this.userRepository = userRepository;
    this.patientProfileService = patientProfileService;
  }

  @PostMapping
  public OnboardingResponse save(@AuthenticationPrincipal UserDetails principal,
                                 @Valid @RequestBody OnboardingRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername())
        .orElseThrow();
    OnboardingAssessment assessment = onboardingService.save(user, request);
    return new OnboardingResponse(toProfileResponse(assessment.getPatientProfile()), toAssessmentResponse(assessment));
  }

  @GetMapping
  public OnboardingResponse get(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername())
        .orElseThrow();
    OnboardingAssessment assessment = onboardingService.get(user);
    PatientProfile profile = assessment != null ? assessment.getPatientProfile() : patientProfileService.getOrCreate(user);
    return new OnboardingResponse(profile != null ? toProfileResponse(profile) : null,
        assessment != null ? toAssessmentResponse(assessment) : null);
  }

  private PatientProfileResponse toProfileResponse(PatientProfile profile) {
    return new PatientProfileResponse(
        profile.getDateOfBirth(),
        profile.getSex(),
        profile.getHeightCm(),
        profile.getWeightKg(),
        profile.getCity(),
        profile.getCountryCode(),
        profile.getOccupation(),
        profile.getCigarettesPerDay(),
        profile.getSmokingStartAge(),
        profile.isOnboardingComplete(),
        profile.isTestsComplete(),
        profile.isJournalComplete(),
        profile.getDependenceLevel() != null ? profile.getDependenceLevel().name() : null,
        profile.getMedicalHistoryNotes()
    );
  }

  private OnboardingAssessmentResponse toAssessmentResponse(OnboardingAssessment assessment) {
    return new OnboardingAssessmentResponse(
        assessment.getAppointmentLeadDays(),
        assessment.getPregnant(),
        assessment.getPregnancyTrimester(),
        assessment.getUsesBirthControlPill(),
        assessment.getConsultationObjective(),
        assessment.getProfessionalStatus(),
        assessment.getOtherSmokersAtHome(),
        assessment.getEducationLevel(),
        assessment.getReferralSource(),
        assessment.getRiskHypertension(),
        assessment.getRiskDiabetes(),
        assessment.getRiskHypercholesterolemia(),
        assessment.getCardiovascularMyocardialInfarction(),
        assessment.getCardiovascularAngina(),
        assessment.getCardiovascularStroke(),
        assessment.getCardiovascularPeripheralArteryDisease(),
        assessment.getRespiratoryChronicBronchitis(),
        assessment.getRespiratoryCopd(),
        assessment.getRespiratoryAsthma(),
        assessment.getCancerLung(),
        assessment.getCancerThroat(),
        assessment.getCancerBladder(),
        assessment.getCancerOther(),
        assessment.getCancerOtherDetails(),
        assessment.getMedicationTranquilizers(),
        assessment.getMedicationSleepingPills(),
        assessment.getMedicationAntidepressants(),
        assessment.getMedicationNeuroleptics(),
        assessment.getMedicationMoodRegulators(),
        assessment.getMedicationSubstitutionTreatment(),
        assessment.getDepressionHistory(),
        assessment.getOtherHealthIssues(),
        assessment.getReducedConsumptionLastMonth(),
        assessment.getCurrentlySmoking(),
        assessment.getQuitDays(),
        assessment.getQuitMonths(),
        assessment.getCigarettesPerDayBeforeQuit(),
        assessment.getSmokesDaily(),
        assessment.getManufacturedCigarettesPerDay(),
        assessment.getRolledCigarettesPerDay(),
        assessment.getCigarillosPerDay(),
        assessment.getUsesCigar(),
        assessment.getUsesPipe(),
        assessment.getUsesChewingTobacco(),
        assessment.getUsesSnus(),
        assessment.getUsesHookah(),
        assessment.getUsesPloom(),
        assessment.getOtherTobaccoDetails(),
        assessment.getUsesECigarette(),
        assessment.getEcigWeeklyLiquid(),
        assessment.getUsesNicotineCartridges(),
        assessment.getNicotineCartridgeDosage(),
        assessment.getWeeklyTobaccoSpend(),
        assessment.getIncomeBracket(),
        assessment.getQuitAttempts(),
        assessment.getLongestQuitDays(),
        assessment.getMotivationStage(),
        assessment.getMotivationScore(),
        assessment.getConfidenceScore(),
        assessment.getSmokingReasonAutomatic(),
        assessment.getSmokingReasonConviviality(),
        assessment.getSmokingReasonPleasure(),
        assessment.getSmokingReasonStress(),
        assessment.getSmokingReasonConcentration(),
        assessment.getSmokingReasonSupportMoral(),
        assessment.getSmokingReasonWeight(),
        assessment.getSmokesAtHome(),
        assessment.getUsesOtherTobacco(),
        assessment.getTriggers(),
        assessment.getQuitReasons(),
        assessment.getQuitFears(),
        assessment.getAlcoholFrequency(),
        assessment.getAlcoholQuantity(),
        assessment.getAlcoholBinge(),
        assessment.getAlcoholScore(),
        assessment.getNotes(),
        assessment.getCageCutDown(),
        assessment.getCageAnnoyed(),
        assessment.getCageGuilty(),
        assessment.getCageEyeOpener(),
        assessment.getCageScore(),
        assessment.getCagePositive(),
        assessment.getCannabisLast12Months(),
        assessment.getCannabisFrequency(),
        assessment.getCannabisStartAge(),
        assessment.getWeightConcernScore(),
        assessment.getWeightConfidenceScore(),
        assessment.getPhysicalActivityLevel(),
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
        assessment.getEpicesQ59(),
        assessment.getEpicesScore(),
        assessment.getHoncQ1(),
        assessment.getHoncQ2(),
        assessment.getHoncQ3(),
        assessment.getHoncQ4(),
        assessment.getHoncQ5(),
        assessment.getHoncQ6(),
        assessment.getHoncQ7(),
        assessment.getHoncQ8(),
        assessment.getHoncQ9(),
        assessment.getHoncQ10(),
        assessment.getHoncScore(),
        assessment.getHoncHighDependence()
    );
  }
}
