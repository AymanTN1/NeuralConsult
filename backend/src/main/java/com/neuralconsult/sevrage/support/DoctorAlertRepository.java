package com.neuralconsult.sevrage.support;

import com.neuralconsult.sevrage.doctor.DoctorProfile;
import com.neuralconsult.sevrage.patient.PatientProfile;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorAlertRepository extends JpaRepository<DoctorAlert, UUID> {
  List<DoctorAlert> findAllByDoctorProfileOrderByCreatedAtDesc(DoctorProfile doctorProfile);

  List<DoctorAlert> findAllByPatientProfileOrderByCreatedAtDesc(PatientProfile patientProfile);
}
