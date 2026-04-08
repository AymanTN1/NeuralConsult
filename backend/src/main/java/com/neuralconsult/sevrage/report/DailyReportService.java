package com.neuralconsult.sevrage.report;

import com.neuralconsult.sevrage.clinical.intelligence.ClinicalIntelligenceService;
import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileService;
import com.neuralconsult.sevrage.report.dto.DailyReportRequest;
import com.neuralconsult.sevrage.user.User;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class DailyReportService {

  private final DailyReportRepository repository;
  private final PatientProfileService patientProfileService;
  private final ClinicalIntelligenceService clinicalIntelligenceService;

  public DailyReportService(DailyReportRepository repository,
                            PatientProfileService patientProfileService,
                            ClinicalIntelligenceService clinicalIntelligenceService) {
    this.repository = repository;
    this.patientProfileService = patientProfileService;
    this.clinicalIntelligenceService = clinicalIntelligenceService;
  }

  @Transactional
  public DailyReport upsert(User user, DailyReportRequest request) {
    PatientProfile profile = patientProfileService.getOrCreate(user);
    LocalDate date = request.reportDate() != null ? request.reportDate() : LocalDate.now();

    DailyReport report = repository.findByPatientProfileAndReportDate(profile, date)
        .orElseGet(() -> {
          DailyReport created = new DailyReport();
          created.setPatientProfile(profile);
          created.setReportDate(date);
          return created;
        });

    report.setCigarettesSmoked(request.cigarettesSmoked());
    report.setCravingsIntensity(request.cravingsIntensity());
    report.setMoodScore(request.moodScore());
    report.setStressScore(request.stressScore());
    report.setUsedNrt(request.usedNrt());
    report.setRelapseEvent(request.relapseEvent());
    report.setNotes(request.notes());

    DailyReport saved = repository.save(report);
    patientProfileService.markJournalComplete(user, true);
    if (profile.isOnboardingComplete() && profile.isTestsComplete()) {
      if (TransactionSynchronizationManager.isSynchronizationActive()) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
          @Override
          public void afterCommit() {
            try {
              clinicalIntelligenceService.generateAndSave(user);
            } catch (RuntimeException ignored) {
            }
          }
        });
      } else {
        try {
          clinicalIntelligenceService.generateAndSave(user);
        } catch (RuntimeException ignored) {
        }
      }
    }
    return saved;
  }

  @Transactional
  public List<DailyReport> list(User user, LocalDate from, LocalDate to) {
    PatientProfile profile = patientProfileService.getOrCreate(user);
    LocalDate end = to != null ? to : LocalDate.now();
    LocalDate start = from != null ? from : end.minusDays(6);
    return repository.findAllByPatientProfileAndReportDateBetween(profile, start, end);
  }

  @Transactional
  public void delete(User user, java.util.UUID id) {
    PatientProfile profile = patientProfileService.getOrCreate(user);
    DailyReport report = repository.findByIdAndPatientProfile(id, profile).orElseThrow();
    repository.delete(report);
    boolean hasRemainingReports = !repository.findAllByPatientProfileAndReportDateBetween(
        profile,
        LocalDate.now().minusYears(5),
        LocalDate.now()
    ).isEmpty();
    patientProfileService.markJournalComplete(user, hasRemainingReports);
  }
}
