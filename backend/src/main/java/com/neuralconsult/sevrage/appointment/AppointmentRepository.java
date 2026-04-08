package com.neuralconsult.sevrage.appointment;

import com.neuralconsult.sevrage.doctor.DoctorProfile;
import com.neuralconsult.sevrage.patient.PatientProfile;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
  List<Appointment> findAllByPatientProfileOrderByStartsAtDesc(PatientProfile patientProfile);

  List<Appointment> findAllByDoctorProfileOrderByStartsAtDesc(DoctorProfile doctorProfile);

  Optional<Appointment> findByIdAndDoctorProfile(UUID id, DoctorProfile doctorProfile);

  Optional<Appointment> findByIdAndPatientProfile(UUID id, PatientProfile patientProfile);

  boolean existsByDoctorProfileAndStartsAtAndStatusIn(
      DoctorProfile doctorProfile,
      LocalDateTime startsAt,
      Collection<Appointment.Status> statuses
  );
}
