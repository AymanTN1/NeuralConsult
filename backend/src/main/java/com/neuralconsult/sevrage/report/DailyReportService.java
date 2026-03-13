package com.neuralconsult.sevrage.report;

import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileService;
import com.neuralconsult.sevrage.report.dto.DailyReportRequest;
import com.neuralconsult.sevrage.user.User;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DailyReportService {

  private final DailyReportRepository repository;
  private final PatientProfileService patientProfileService;

  public DailyReportService(DailyReportRepository repository, PatientProfileService patientProfileService) {
    this.repository = repository;
    this.patientProfileService = patientProfileService;
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

    return repository.save(report);
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
  }
}
