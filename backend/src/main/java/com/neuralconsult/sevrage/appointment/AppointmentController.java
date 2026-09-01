package com.neuralconsult.sevrage.appointment;

import com.neuralconsult.sevrage.appointment.dto.AppointmentDecisionRequest;
import com.neuralconsult.sevrage.appointment.dto.AppointmentRequest;
import com.neuralconsult.sevrage.appointment.dto.AppointmentResponse;
import com.neuralconsult.sevrage.appointment.dto.AppointmentUpdateRequest;
import com.neuralconsult.sevrage.appointment.dto.AvailableAppointmentSlotResponse;
import com.neuralconsult.sevrage.appointment.dto.DoctorAvailabilityRequest;
import com.neuralconsult.sevrage.appointment.dto.DoctorAvailabilityResponse;
import com.neuralconsult.sevrage.appointment.dto.DoctorUrgentAppointmentRequest;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import jakarta.transaction.Transactional;
import java.util.List;
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
@RequestMapping("/api/appointments")
@Transactional
public class AppointmentController {

  private final AppointmentService appointmentService;
  private final UserRepository userRepository;

  public AppointmentController(AppointmentService appointmentService, UserRepository userRepository) {
    this.appointmentService = appointmentService;
    this.userRepository = userRepository;
  }

  @GetMapping("/patient")
  @PreAuthorize("hasAnyAuthority('ROLE_PATIENT', 'ROLE_USER')")
  public List<AppointmentResponse> listPatientAppointments(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return appointmentService.listForPatient(user).stream().map(this::toResponse).toList();
  }

  @GetMapping("/availability/patient")
  @PreAuthorize("hasAnyAuthority('ROLE_PATIENT', 'ROLE_USER')")
  public List<AvailableAppointmentSlotResponse> listPatientAvailableSlots(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return appointmentService.listAvailableSlotsForPatient(user);
  }

  @PostMapping
  @PreAuthorize("hasAnyAuthority('ROLE_PATIENT', 'ROLE_USER')")
  public AppointmentResponse requestAppointment(@AuthenticationPrincipal UserDetails principal,
                                                @RequestBody AppointmentRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return toResponse(appointmentService.request(user, request));
  }

  @PostMapping("/{id}/cancel")
  @PreAuthorize("hasAnyAuthority('ROLE_PATIENT', 'ROLE_USER')")
  public AppointmentResponse cancelPatientAppointment(@AuthenticationPrincipal UserDetails principal,
                                                      @PathVariable java.util.UUID id) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return toResponse(appointmentService.cancelAsPatient(user, id));
  }

  @PostMapping("/{id}/patient-update")
  @PreAuthorize("hasAnyAuthority('ROLE_PATIENT', 'ROLE_USER')")
  public AppointmentResponse updatePatientAppointment(@AuthenticationPrincipal UserDetails principal,
                                                      @PathVariable java.util.UUID id,
                                                      @RequestBody AppointmentUpdateRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return toResponse(appointmentService.updateAsPatient(user, id, request));
  }

  @PostMapping("/{id}/cancel-doctor")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public AppointmentResponse cancelDoctorAppointment(@AuthenticationPrincipal UserDetails principal,
                                                     @PathVariable java.util.UUID id) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return toResponse(appointmentService.cancelAsDoctor(user, id));
  }

  @GetMapping("/doctor")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public List<AppointmentResponse> listDoctorAppointments(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return appointmentService.listForDoctor(user).stream().map(this::toResponse).toList();
  }

  @GetMapping("/availability/doctor")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public List<DoctorAvailabilityResponse> listDoctorAvailabilities(@AuthenticationPrincipal UserDetails principal) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return appointmentService.listAvailabilitiesForDoctor(user).stream().map(this::toAvailabilityResponse).toList();
  }

  @PostMapping("/availability/doctor")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public DoctorAvailabilityResponse saveDoctorAvailability(@AuthenticationPrincipal UserDetails principal,
                                                           @RequestBody DoctorAvailabilityRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return toAvailabilityResponse(appointmentService.saveAvailability(user, request));
  }

  @PostMapping("/availability/doctor/{id}/delete")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public void deleteDoctorAvailability(@AuthenticationPrincipal UserDetails principal,
                                       @PathVariable java.util.UUID id) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    appointmentService.deleteAvailability(user, id);
  }

  @PostMapping("/doctor/urgent")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public AppointmentResponse createUrgentAppointment(@AuthenticationPrincipal UserDetails principal,
                                                     @RequestBody DoctorUrgentAppointmentRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return toResponse(appointmentService.createUrgentAsDoctor(user, request));
  }

  @PostMapping("/{id}/doctor-update")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public AppointmentResponse updateDoctorAppointment(@AuthenticationPrincipal UserDetails principal,
                                                     @PathVariable java.util.UUID id,
                                                     @RequestBody AppointmentUpdateRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return toResponse(appointmentService.updateAsDoctor(user, id, request));
  }

  @PostMapping("/{id}/confirm")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public AppointmentResponse confirm(@AuthenticationPrincipal UserDetails principal,
                                     @PathVariable java.util.UUID id,
                                     @RequestBody(required = false) AppointmentDecisionRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return toResponse(appointmentService.updateStatusAsDoctor(user, id, Appointment.Status.CONFIRMED, request));
  }

  @PostMapping("/{id}/refuse")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public AppointmentResponse refuse(@AuthenticationPrincipal UserDetails principal,
                                    @PathVariable java.util.UUID id,
                                    @RequestBody(required = false) AppointmentDecisionRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return toResponse(appointmentService.updateStatusAsDoctor(user, id, Appointment.Status.REFUSED, request));
  }

  @PostMapping("/{id}/complete")
  @PreAuthorize("hasAuthority('ROLE_DOCTOR')")
  public AppointmentResponse complete(@AuthenticationPrincipal UserDetails principal,
                                      @PathVariable java.util.UUID id,
                                      @RequestBody(required = false) AppointmentDecisionRequest request) {
    User user = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
    return toResponse(appointmentService.updateStatusAsDoctor(user, id, Appointment.Status.COMPLETED, request));
  }

  private AppointmentResponse toResponse(Appointment appointment) {
    return new AppointmentResponse(
        appointment.getId(),
        appointment.getPatientProfile().getId(),
        appointment.getPatientProfile().getUser().getFullName(),
        appointment.getDoctorProfile().getId(),
        appointment.getDoctorProfile().getUser().getFullName(),
        appointment.getStartsAt(),
        appointment.getDurationMinutes(),
        appointment.getStatus().name(),
        appointment.getReason(),
        appointment.getDoctorNote(),
        appointment.isTriggeredByAiAlert(),
        appointment.getMeetingProvider(),
        appointment.getMeetingJoinUrl(),
        appointment.getMeetingLinkSentAt(),
        appointment.getMeetingOpenedAt(),
        appointment.getCreatedAt(),
        appointment.getUpdatedAt()
    );
  }

  private DoctorAvailabilityResponse toAvailabilityResponse(DoctorAvailability availability) {
    return new DoctorAvailabilityResponse(
        availability.getId(),
        availability.getAvailableDate(),
        availability.getDayOfWeek() != null ? availability.getDayOfWeek().name() : null,
        availability.getStartTime(),
        availability.getEndTime(),
        availability.isActive(),
        availability.getBufferMinutes() != null ? availability.getBufferMinutes() : 10,
        availability.getSlotDurationMinutes() != null ? availability.getSlotDurationMinutes() : 20
    );
  }
}
