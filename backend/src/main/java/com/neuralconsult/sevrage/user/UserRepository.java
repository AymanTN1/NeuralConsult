package com.neuralconsult.sevrage.user;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface UserRepository extends JpaRepository<User, UUID> {
  @Transactional(readOnly = true)
  Optional<User> findByEmailIgnoreCase(String email);

  @Transactional(readOnly = true)
  Optional<User> findByCommunityUsernameIgnoreCase(String communityUsername);

  @Transactional(readOnly = true)
  @Query("select distinct u from User u join u.roles r where upper(r) = upper(:role)")
  java.util.List<User> findAllByRole(@Param("role") String role);
}
