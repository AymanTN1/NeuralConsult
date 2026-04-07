package com.neuralconsult.sevrage.doctor;

import com.neuralconsult.sevrage.user.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorProfileRepository extends JpaRepository<DoctorProfile, UUID> {
  Optional<DoctorProfile> findByUser(User user);
  List<DoctorProfile> findAllByActiveTrue();
  List<DoctorProfile> findAllByActiveFalseOrderByCreatedAtAsc();
}
