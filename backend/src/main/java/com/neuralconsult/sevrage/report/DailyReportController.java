package com.neuralconsult.sevrage.report;

import com.neuralconsult.sevrage.report.dto.DailyReportRequest;
import com.neuralconsult.sevrage.report.dto.DailyReportResponse;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/api/daily-reports")
public class DailyReportController {

  private final DailyReportService dailyReportService;
  private final UserRepository userRepository;

  public DailyReportController(DailyReportService dailyReportService, UserRepository userRepository) {
    this.dailyReportService = dailyReportService;
    this.userRepository = userRepository;
  }

  @PostMapping
  public DailyReportResponse upsert(@AuthenticationPrincipal UserDetails principal,
                                    @RequestBody DailyReportRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername())
        .orElseThrow();
    DailyReport report = dailyReportService.upsert(user, request);
    return toResponse(report);
  }

  @GetMapping
  public List<DailyReportResponse> list(@AuthenticationPrincipal UserDetails principal,
                                        @RequestParam(required = false) LocalDate from,
                                        @RequestParam(required = false) LocalDate to) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername())
        .orElseThrow();
    return dailyReportService.list(user, from, to)
        .stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
  }

  @DeleteMapping("/{id}")
  public void delete(@AuthenticationPrincipal UserDetails principal,
                     @PathVariable UUID id) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername())
        .orElseThrow();
    dailyReportService.delete(user, id);
  }

  private DailyReportResponse toResponse(DailyReport report) {
    return new DailyReportResponse(
        report.getId(),
        report.getReportDate(),
        report.getCigarettesSmoked(),
        report.getCravingsIntensity(),
        report.getMoodScore(),
        report.getStressScore(),
        report.getUsedNrt(),
        report.getRelapseEvent(),
        report.getNotes()
    );
  }
}
