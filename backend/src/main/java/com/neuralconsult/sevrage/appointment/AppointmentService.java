package com.neuralconsult.sevrage.appointment;

import com.neuralconsult.sevrage.appointment.dto.AppointmentDecisionRequest;
import com.neuralconsult.sevrage.appointment.dto.AppointmentRequest;
import com.neuralconsult.sevrage.doctor.DoctorProfile;
import com.neuralconsult.sevrage.doctor.DoctorProfileRepository;
import com.neuralconsult.sevrage.patient.PatientProfile;
import com.neuralconsult.sevrage.patient.PatientProfileService;
import com.neuralconsult.sevrage.user.User;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AppointmentService {

  private final AppointmentRepository appointmentRepository;
  private final DoctorProfileRepository doctorProfileRepository;
  private final PatientProfileService patientProfileService;

  public AppointmentService(AppointmentRepository appointmentRepository,
                            DoctorProfileRepository doctorProfileRepository,
                            PatientProfileService patientProfileService) {
    this.appointmentRepository = appointmentRepository;
    this.doctorProfileRepository = doctorProfileRepository;
    this.patientProfileService = patientProfileService;
  }

  @Transactional
  public Appointment request(User patientUser, AppointmentRequest request) {
    PatientProfile patientProfile = patientProfileService.getOrCreate(patientUser);
    DoctorProfile doctorProfile = doctorProfileRepository.findById(request.doctorProfileId()).orElseThrow();
    if (!doctorProfile.isActive()) {
      throw new IllegalArgumentException("Le compte medecin n'est pas encore valide.");
    }
    validateSlot(request.startsAt());
    boolean occupied = appointmentRepository.existsByDoctorProfileAndStartsAtAndStatusIn(
        doctorProfile,
        request.startsAt(),
        EnumSet.of(Appointment.Status.REQUESTED, Appointment.Status.CONFIRMED)
    );
    if (occupied) {
      throw new IllegalArgumentException("Ce creneau est deja reserve.");
    }
    Appointment appointment = new Appointment();
    appointment.setPatientProfile(patientProfile);
    appointment.setDoctorProfile(doctorProfile);
    appointment.setStartsAt(request.startsAt());
    appointment.setReason(request.reason());
    appointment.setPatientNote(request.reason());
    appointment.setTriggeredByAiAlert(Boolean.TRUE.equals(request.triggeredByAiAlert()));
    return appointmentRepository.save(appointment);
  }

  @Transactional
  public List<Appointment> listForPatient(User patientUser) {
    PatientProfile patientProfile = patientProfileService.getOrCreate(patientUser);
    return appointmentRepository.findAllByPatientProfileOrderByStartsAtDesc(patientProfile);
  }

  @Transactional
  public List<Appointment> listForDoctor(User doctorUser) {
    DoctorProfile doctorProfile = doctorProfileRepository.findByUser(doctorUser).orElseThrow();
    return appointmentRepository.findAllByDoctorProfileOrderByStartsAtDesc(doctorProfile);
  }

  @Transactional
  public Appointment updateStatusAsDoctor(User doctorUser,
                                          java.util.UUID appointmentId,
                                          Appointment.Status status,
                                          AppointmentDecisionRequest request) {
    DoctorProfile doctorProfile = doctorProfileRepository.findByUser(doctorUser).orElseThrow();
    Appointment appointment = appointmentRepository.findByIdAndDoctorProfile(appointmentId, doctorProfile).orElseThrow();
    appointment.setStatus(status);
    if (request != null) {
      appointment.setDoctorNote(request.doctorNote());
    }
    return appointmentRepository.save(appointment);
  }

  @Transactional
  public Appointment cancelAsPatient(User patientUser, java.util.UUID appointmentId) {
    PatientProfile patientProfile = patientProfileService.getOrCreate(patientUser);
    Appointment appointment = appointmentRepository.findByIdAndPatientProfile(appointmentId, patientProfile).orElseThrow();
    appointment.setStatus(Appointment.Status.CANCELLED);
    return appointmentRepository.save(appointment);
  }

  private void validateSlot(LocalDateTime startsAt) {
    if (startsAt == null) {
      throw new IllegalArgumentException("La date du rendez-vous est obligatoire.");
    }
    if (startsAt.isBefore(LocalDateTime.now().minusMinutes(1))) {
      throw new IllegalArgumentException("Le rendez-vous doit etre planifie dans le futur.");
    }
    int minute = startsAt.getMinute();
    if (!(minute == 0 || minute == 20 || minute == 40)) {
      throw new IllegalArgumentException("Les seances sont planifiees par creneaux de 20 minutes.");
    }
  }
}
