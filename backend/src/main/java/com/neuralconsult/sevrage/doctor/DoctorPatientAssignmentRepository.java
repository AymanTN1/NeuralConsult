package com.neuralconsult.sevrage.doctor;

import com.neuralconsult.sevrage.patient.PatientProfile;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorPatientAssignmentRepository extends JpaRepository<DoctorPatientAssignment, UUID> {
  Optional<DoctorPatientAssignment> findByPatientProfile(PatientProfile patientProfile);
  Optional<DoctorPatientAssignment> findByPatientProfileAndActiveTrue(PatientProfile patientProfile);
  Optional<DoctorPatientAssignment> findByDoctorProfileAndPatientProfileAndActiveTrue(DoctorProfile doctorProfile,
                                                                                      PatientProfile patientProfile);
  List<DoctorPatientAssignment> findAllByDoctorProfileAndActiveTrue(DoctorProfile doctorProfile);
}
