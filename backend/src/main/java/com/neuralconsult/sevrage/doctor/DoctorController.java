package com.neuralconsult.sevrage.doctor;

import com.neuralconsult.sevrage.clinical.intelligence.AiGlobalSummary;
import com.neuralconsult.sevrage.clinical.intelligence.AiGlobalSummaryRepository;
import com.neuralconsult.sevrage.clinical.intelligence.AiPhaseSummary;
import com.neuralconsult.sevrage.clinical.intelligence.AiPhaseSummaryRepository;
import com.neuralconsult.sevrage.clinical.intelligence.AiPlanCandidate;
import com.neuralconsult.sevrage.clinical.intelligence.AiPlanCandidateRepository;
import com.neuralconsult.sevrage.clinical.intelligence.ClinicalIntelligenceResponseBuilder;
import com.neuralconsult.sevrage.clinical.intelligence.ValidatedTreatmentPlan;
import com.neuralconsult.sevrage.clinical.intelligence.ValidatedTreatmentPlanRepository;
import com.neuralconsult.sevrage.clinical.notes.ClinicalNote;
import com.neuralconsult.sevrage.clinical.notes.ClinicalNoteRepository;
import com.neuralconsult.sevrage.clinical.notes.dto.ClinicalNoteResponse;
import com.neuralconsult.sevrage.doctor.dto.DoctorFagerstromSummaryResponse;
import com.neuralconsult.sevrage.doctor.dto.DoctorHadSummaryResponse;
import com.neuralconsult.sevrage.doctor.dto.DoctorPatientDecisionRequest;
import com.neuralconsult.sevrage.doctor.dto.DoctorPatientDossierResponse;
import com.neuralconsult.sevrage.doctor.dto.DoctorPatientRequestCreateRequest;
import com.neuralconsult.sevrage.doctor.dto.DoctorPatientRequestResponse;
import com.neuralconsult.sevrage.doctor.dto.DoctorPatientSummaryResponse;
import com.neuralconsult.sevrage.doctor.dto.DoctorProfileRequest;
import com.neuralconsult.sevrage.doctor.dto.DoctorProfileResponse;
import com.neuralconsult.sevrage.medical.tests.FagerstromTest;
import com.neuralconsult.sevrage.medical.tests.FagerstromTestRepository;
import com.neuralconsult.sevrage.medical.tests.HadTest;
import com.neuralconsult.sevrage.medical.tests.HadTestRepository;
import com.neuralconsult.sevrage.onboarding.OnboardingAssessment;
import com.neuralconsult.sevrage.onboarding.OnboardingRepository;
import com.neuralconsult.sevrage.onboarding.dto.OnboardingAssessmentResponse;
import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.user.dto.PatientProfileResponse;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

  private final DoctorProfileService doctorProfileService;
  private final DoctorProfileRepository doctorProfileRepository;
  private final DoctorPatientRequestService requestService;
  private final DoctorPatientAssignmentRepository assignmentRepository;
  private final UserRepository userRepository;
  private final OnboardingRepository onboardingRepository;
  private final FagerstromTestRepository fagerstromTestRepository;
  private final HadTestRepository hadTestRepository;
  private final ClinicalNoteRepository clinicalNoteRepository;
  private final AiPhaseSummaryRepository aiPhaseSummaryRepository;
  private final AiGlobalSummaryRepository aiGlobalSummaryRepository;
  private final AiPlanCandidateRepository aiPlanCandidateRepository;
  private final ValidatedTreatmentPlanRepository validatedTreatmentPlanRepository;

  public DoctorController(
      DoctorProfileService doctorProfileService,
      DoctorProfileRepository doctorProfileRepository,
      DoctorPatientRequestService requestService,
      DoctorPatientAssignmentRepository assignmentRepository,
      UserRepository userRepository,
      OnboardingRepository onboardingRepository,
      FagerstromTestRepository fagerstromTestRepository,
      HadTestRepository hadTestRepository,
      ClinicalNoteRepository clinicalNoteRepository,
      AiPhaseSummaryRepository aiPhaseSummaryRepository,
      AiGlobalSummaryRepository aiGlobalSummaryRepository,
      AiPlanCandidateRepository aiPlanCandidateRepository,
      ValidatedTreatmentPlanRepository validatedTreatmentPlanRepository
  ) {
    this.doctorProfileService = doctorProfileService;
    this.doctorProfileRepository = doctorProfileRepository;
    this.requestService = requestService;
    this.assignmentRepository = assignmentRepository;
    this.userRepository = userRepository;
    this.onboardingRepository = onboardingRepository;
    this.fagerstromTestRepository = fagerstromTestRepository;
    this.hadTestRepository = hadTestRepository;
    this.clinicalNoteRepository = clinicalNoteRepository;
    this.aiPhaseSummaryRepository = aiPhaseSummaryRepository;
    this.aiGlobalSummaryRepository = aiGlobalSummaryRepository;
    this.aiPlanCandidateRepository = aiPlanCandidateRepository;
    this.validatedTreatmentPlanRepository = validatedTreatmentPlanRepository;
  }

  @PostMapping("/profile")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public DoctorProfileResponse createOrUpdateProfile(@AuthenticationPrincipal UserDetails principal,
                                                     @RequestBody DoctorProfileRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    DoctorProfile profile = doctorProfileService.createOrUpdate(user, request);
    return toResponse(profile, null, null);
  }

  @GetMapping("/profile/me")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public DoctorProfileResponse getMyProfile(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    DoctorProfile profile = doctorProfileService.getOrNull(user);
    return profile != null ? toResponse(profile, null, null) : null;
  }

  @GetMapping
  @PreAuthorize("hasAuthority('ROLE_PATIENT')")
  public List<DoctorProfileResponse> listDoctors(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return doctorProfileService.listMatchesForPatient(user).stream()
        .map(match -> toResponse(match.doctorProfile(), match.matchingMode().name(), match.matchingScore()))
        .toList();
  }

  @PostMapping("/requests")
  @PreAuthorize("hasAuthority('ROLE_PATIENT')")
  public DoctorPatientRequestResponse sendRequest(@AuthenticationPrincipal UserDetails principal,
                                                  @RequestBody DoctorPatientRequestCreateRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    DoctorProfile doctor = doctorProfileRepository.findById(request.doctorProfileId()).orElseThrow();
    DoctorProfileService.DoctorMatch match = doctorProfileService.listMatchesForPatient(user).stream()
        .filter(item -> item.doctorProfile().getId().equals(doctor.getId()))
        .findFirst()
        .orElse(new DoctorProfileService.DoctorMatch(doctor, DoctorPatientRequest.MatchingMode.TELECONSULTATION, 0));
    DoctorPatientRequest saved = requestService.create(user, doctor, request.patientMessage(), match.matchingMode(), match.matchingScore());
    return toRequestResponse(saved);
  }

  @GetMapping("/requests/patient")
  @PreAuthorize("hasAuthority('ROLE_PATIENT')")
  public List<DoctorPatientRequestResponse> listPatientRequests(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return requestService.listForPatient(user).stream().map(this::toRequestResponse).toList();
  }

  @GetMapping("/requests/doctor")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public List<DoctorPatientRequestResponse> listDoctorRequests(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return requestService.listForDoctor(user).stream().map(this::toRequestResponse).toList();
  }

  @PostMapping("/requests/{id}/accept")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public DoctorPatientRequestResponse accept(@AuthenticationPrincipal UserDetails principal,
                                             @PathVariable UUID id,
                                             @RequestBody(required = false) DoctorPatientDecisionRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    DoctorPatientRequest saved = requestService.decide(
        user,
        id,
        DoctorPatientRequest.RequestStatus.ACCEPTED,
        request != null ? request.note() : null
    );
    return toRequestResponse(saved);
  }

  @PostMapping("/requests/{id}/refuse")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public DoctorPatientRequestResponse refuse(@AuthenticationPrincipal UserDetails principal,
                                             @PathVariable UUID id,
                                             @RequestBody(required = false) DoctorPatientDecisionRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    DoctorPatientRequest saved = requestService.decide(
        user,
        id,
        DoctorPatientRequest.RequestStatus.REFUSED,
        request != null ? request.note() : null
    );
    return toRequestResponse(saved);
  }

  @GetMapping("/patients")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public List<DoctorPatientSummaryResponse> listAssignedPatients(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return requestService.listAssignments(user).stream()
        .map(assignment -> new DoctorPatientSummaryResponse(
            assignment.getPatientProfile().getId(),
            assignment.getPatientProfile().getUser().getFullName(),
            assignment.getPatientProfile().getFagerstromScore(),
            assignment.getPatientProfile().getHadAnxietyScore(),
            assignment.getPatientProfile().getHadDepressionScore(),
            assignment.getPatientProfile().isOnboardingComplete()
        ))
        .toList();
  }

  @GetMapping("/patients/{patientProfileId}/dossier")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public DoctorPatientDossierResponse getPatientDossier(@AuthenticationPrincipal UserDetails principal,
                                                        @PathVariable UUID patientProfileId) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    DoctorProfile doctorProfile = doctorProfileRepository.findByUser(user).orElseThrow();
    PatientProfile patientProfile = assignmentRepository.findAllByDoctorProfileAndActiveTrue(doctorProfile).stream()
        .map(DoctorPatientAssignment::getPatientProfile)
        .filter(profile -> profile.getId().equals(patientProfileId))
        .findFirst()
        .orElseThrow();

    OnboardingAssessment assessment = onboardingRepository.findByPatientProfile(patientProfile).orElse(null);
    FagerstromTest latestFager = fagerstromTestRepository.findFirstByPatientProfileOrderByCreatedAtDesc(patientProfile).orElse(null);
    HadTest latestHad = hadTestRepository.findFirstByPatientProfileOrderByCreatedAtDesc(patientProfile).orElse(null);
    ClinicalNote note = clinicalNoteRepository.findByPatientProfile(patientProfile).orElse(null);
    List<AiPhaseSummary> phaseSummaries = aiPhaseSummaryRepository.findAllByPatientProfileOrderByPhaseIdAsc(patientProfile);
    AiGlobalSummary globalSummary = aiGlobalSummaryRepository.findByPatientProfile(patientProfile).orElse(null);
    List<AiPlanCandidate> planCandidates = aiPlanCandidateRepository.findAllByPatientProfileOrderByTrackAsc(patientProfile);
    ValidatedTreatmentPlan validatedPlan = validatedTreatmentPlanRepository.findByPatientProfile(patientProfile).orElse(null);

    return new DoctorPatientDossierResponse(
        patientProfile.getId(),
        patientProfile.getUser().getFullName(),
        patientProfile.getUser().getEmail(),
        toPatientProfileResponse(patientProfile),
        assessment != null ? toAssessmentResponse(assessment) : null,
        latestFager != null
            ? new DoctorFagerstromSummaryResponse(
                latestFager.getId(),
                latestFager.getTotalScore(),
                latestFager.getDependenceLevel() != null ? latestFager.getDependenceLevel().name() : null,
                latestFager.getTimeToFirstCigarette() != null ? latestFager.getTimeToFirstCigarette().name() : null,
                latestFager.getCigarettesPerDay() != null ? latestFager.getCigarettesPerDay().name() : null,
                latestFager.getCreatedAt()
            )
            : null,
        latestHad != null
            ? new DoctorHadSummaryResponse(
                latestHad.getId(),
                latestHad.getAnxietyScore(),
                latestHad.getDepressionScore(),
                latestHad.getAnxietyInterpretation() != null ? latestHad.getAnxietyInterpretation().name() : null,
                latestHad.getDepressionInterpretation() != null ? latestHad.getDepressionInterpretation().name() : null,
                latestHad.getCreatedAt()
            )
            : null,
        note != null
            ? new ClinicalNoteResponse(
                note.getMedicalSummary(),
                note.getComplementaryNote(),
                note.getValidationStatus() != null ? note.getValidationStatus().name() : null,
                note.getModelName(),
                note.getUpdatedAt()
            )
            : null,
        ClinicalIntelligenceResponseBuilder.build(
            phaseSummaries,
            globalSummary,
            planCandidates,
            validatedPlan
        )
    );
  }

  private DoctorProfileResponse toResponse(DoctorProfile profile, String matchingMode, Integer matchingScore) {
    return new DoctorProfileResponse(
        profile.getId(),
        profile.getUser().getId(),
        profile.getUser().getFullName(),
        profile.getUser().getEmail(),
        profile.getCity(),
        profile.getCountryCode(),
        profile.getSpecialty(),
        profile.getBio(),
        profile.isAcceptsTeleconsultation(),
        profile.getYearsExperience(),
        profile.getSuccessScore(),
        profile.isActive(),
        matchingMode,
        matchingScore
    );
  }

  private DoctorPatientRequestResponse toRequestResponse(DoctorPatientRequest request) {
    return new DoctorPatientRequestResponse(
        request.getId(),
        request.getStatus().name(),
        request.getMatchingMode() != null ? request.getMatchingMode().name() : null,
        request.getMatchingScore(),
        request.getPatientMessage(),
        request.getDoctorResponseNote(),
        request.getAnsweredAt(),
        request.getCreatedAt(),
        request.getDoctorProfile().getId(),
        request.getDoctorProfile().getUser().getFullName(),
        request.getPatientProfile().getId(),
        request.getPatientProfile().getUser().getFullName()
    );
  }

  private PatientProfileResponse toPatientProfileResponse(PatientProfile profile) {
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
