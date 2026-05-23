package com.neuralconsult.sevrage.support;

import com.neuralconsult.sevrage.support.dto.DoctorAlertResponse;
import com.neuralconsult.sevrage.support.dto.SupportChatRequest;
import com.neuralconsult.sevrage.support.dto.SupportConversationResponse;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/support")
public class SupportController {

  private final SupportService supportService;
  private final UserRepository userRepository;

  public SupportController(SupportService supportService, UserRepository userRepository) {
    this.supportService = supportService;
    this.userRepository = userRepository;
  }

  @GetMapping("/current")
  @PreAuthorize("hasAnyAuthority('ROLE_PATIENT', 'ROLE_USER')")
  public SupportConversationResponse current(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return supportService.getForPatient(user);
  }

  @PostMapping("/current/messages")
  @PreAuthorize("hasAnyAuthority('ROLE_PATIENT', 'ROLE_USER')")
  public SupportConversationResponse send(@AuthenticationPrincipal UserDetails principal,
                                          @RequestBody SupportChatRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return supportService.sendAsPatient(
        user,
        request.message(),
        Boolean.TRUE.equals(request.emergencyMode()),
        request.preferredLanguage()
    );
  }

  @GetMapping("/doctor/alerts")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public List<DoctorAlertResponse> doctorAlerts(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return supportService.listDoctorAlerts(user);
  }

  @PostMapping("/doctor/alerts/{id}/acknowledge")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public DoctorAlertResponse acknowledge(@AuthenticationPrincipal UserDetails principal,
                                         @PathVariable UUID id) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return supportService.acknowledgeAlert(user, id);
  }

  @GetMapping("/doctor/patients/{patientProfileId}")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public SupportConversationResponse doctorPatientConversation(@AuthenticationPrincipal UserDetails principal,
                                                               @PathVariable UUID patientProfileId) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return supportService.getForDoctor(user, patientProfileId);
  }
}
