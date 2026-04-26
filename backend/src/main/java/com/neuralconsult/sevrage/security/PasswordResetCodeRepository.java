package com.neuralconsult.sevrage.security;

import com.neuralconsult.sevrage.user.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, UUID> {
  Optional<PasswordResetCode> findFirstByUserAndCodeAndUsedAtIsNullOrderByCreatedAtDesc(User user, String code);

  List<PasswordResetCode> findAllByUserAndUsedAtIsNull(User user);
}
