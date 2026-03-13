package com.neuralconsult.sevrage.medical.tests;

import com.neuralconsult.sevrage.medical.scoring.MedicalScoringService;
import com.neuralconsult.sevrage.medical.scoring.dto.FagerstromRequest;
import com.neuralconsult.sevrage.medical.scoring.dto.FagerstromResult;
import com.neuralconsult.sevrage.medical.scoring.dto.HadRequest;
import com.neuralconsult.sevrage.medical.scoring.dto.HadResult;
import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileService;
import com.neuralconsult.sevrage.patient.dto.ScoreUpdateRequest;
import com.neuralconsult.sevrage.user.User;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ClinicalTestService {

  private final MedicalScoringService scoringService;
  private final PatientProfileService patientProfileService;
  private final FagerstromTestRepository fagerstromTestRepository;
  private final HadTestRepository hadTestRepository;

  public ClinicalTestService(MedicalScoringService scoringService,
                             PatientProfileService patientProfileService,
                             FagerstromTestRepository fagerstromTestRepository,
                             HadTestRepository hadTestRepository) {
    this.scoringService = scoringService;
    this.patientProfileService = patientProfileService;
    this.fagerstromTestRepository = fagerstromTestRepository;
    this.hadTestRepository = hadTestRepository;
  }

  @Transactional
  public FagerstromTest createFagerstrom(User user, FagerstromRequest request) {
    PatientProfile profile = patientProfileService.getOrCreate(user);
    FagerstromResult result = scoringService.scoreFagerstrom(request);

    FagerstromTest test = new FagerstromTest();
    test.setPatientProfile(profile);
    applyFagerstrom(test, request, result);
    FagerstromTest saved = fagerstromTestRepository.save(test);

    patientProfileService.updateScores(user, new ScoreUpdateRequest(result.totalScore(), null, null));
    return saved;
  }

  @Transactional
  public FagerstromTest updateFagerstrom(User user, UUID id, FagerstromRequest request) {
    PatientProfile profile = patientProfileService.getOrCreate(user);
    FagerstromTest test = fagerstromTestRepository.findByIdAndPatientProfile(id, profile)
        .orElseThrow();
    FagerstromResult result = scoringService.scoreFagerstrom(request);
    applyFagerstrom(test, request, result);
    FagerstromTest saved = fagerstromTestRepository.save(test);
    patientProfileService.updateScores(user, new ScoreUpdateRequest(result.totalScore(), null, null));
    return saved;
  }

  @Transactional
  public void deleteFagerstrom(User user, UUID id) {
    PatientProfile profile = patientProfileService.getOrCreate(user);
    FagerstromTest test = fagerstromTestRepository.findByIdAndPatientProfile(id, profile)
        .orElseThrow();
    fagerstromTestRepository.delete(test);
    Integer latestScore = fagerstromTestRepository.findFirstByPatientProfileOrderByCreatedAtDesc(profile)
        .map(FagerstromTest::getTotalScore)
        .orElse(null);
    patientProfileService.setScores(user, latestScore, profile.getHadAnxietyScore(), profile.getHadDepressionScore());
  }

  @Transactional
  public List<FagerstromTest> listFagerstrom(User user) {
    PatientProfile profile = patientProfileService.getOrCreate(user);
    return fagerstromTestRepository.findAllByPatientProfileOrderByCreatedAtDesc(profile);
  }

  @Transactional
  public HadTest createHad(User user, HadRequest request) {
    PatientProfile profile = patientProfileService.getOrCreate(user);
    HadResult result = scoringService.scoreHad(request);

    HadTest test = new HadTest();
    test.setPatientProfile(profile);
    applyHad(test, request, result);
    HadTest saved = hadTestRepository.save(test);
    patientProfileService.updateScores(user, new ScoreUpdateRequest(null, result.anxietyScore(), result.depressionScore()));
    return saved;
  }

  @Transactional
  public HadTest updateHad(User user, UUID id, HadRequest request) {
    PatientProfile profile = patientProfileService.getOrCreate(user);
    HadTest test = hadTestRepository.findByIdAndPatientProfile(id, profile)
        .orElseThrow();
    HadResult result = scoringService.scoreHad(request);
    applyHad(test, request, result);
    HadTest saved = hadTestRepository.save(test);
    patientProfileService.updateScores(user, new ScoreUpdateRequest(null, result.anxietyScore(), result.depressionScore()));
    return saved;
  }

  @Transactional
  public void deleteHad(User user, UUID id) {
    PatientProfile profile = patientProfileService.getOrCreate(user);
    HadTest test = hadTestRepository.findByIdAndPatientProfile(id, profile)
        .orElseThrow();
    hadTestRepository.delete(test);
    HadTest latest = hadTestRepository.findFirstByPatientProfileOrderByCreatedAtDesc(profile).orElse(null);
    Integer anxiety = latest != null ? latest.getAnxietyScore() : null;
    Integer depression = latest != null ? latest.getDepressionScore() : null;
    patientProfileService.setScores(user, profile.getFagerstromScore(), anxiety, depression);
  }

  @Transactional
  public List<HadTest> listHad(User user) {
    PatientProfile profile = patientProfileService.getOrCreate(user);
    return hadTestRepository.findAllByPatientProfileOrderByCreatedAtDesc(profile);
  }

  private void applyFagerstrom(FagerstromTest test, FagerstromRequest request, FagerstromResult result) {
    test.setTimeToFirstCigarette(request.timeToFirstCigarette());
    test.setDifficultToRefrain(request.difficultToRefrain());
    test.setMostDifficultCigarette(request.mostDifficultCigarette());
    test.setCigarettesPerDay(request.cigarettesPerDay());
    test.setSmokeMoreInMorning(request.smokeMoreInMorning());
    test.setSmokeWhenIll(request.smokeWhenIll());
    test.setTotalScore(result.totalScore());
    test.setDependenceLevel(result.dependenceLevel());
  }

  private void applyHad(HadTest test, HadRequest request, HadResult result) {
    test.setQ1(request.q1());
    test.setQ2(request.q2());
    test.setQ3(request.q3());
    test.setQ4(request.q4());
    test.setQ5(request.q5());
    test.setQ6(request.q6());
    test.setQ7(request.q7());
    test.setQ8(request.q8());
    test.setQ9(request.q9());
    test.setQ10(request.q10());
    test.setQ11(request.q11());
    test.setQ12(request.q12());
    test.setQ13(request.q13());
    test.setQ14(request.q14());
    test.setAnxietyScore(result.anxietyScore());
    test.setDepressionScore(result.depressionScore());
    test.setAnxietyInterpretation(result.anxietyInterpretation());
    test.setDepressionInterpretation(result.depressionInterpretation());
  }
}
