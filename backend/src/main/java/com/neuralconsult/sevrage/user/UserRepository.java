package com.neuralconsult.sevrage.user;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, UUID> {
  Optional<User> findByEmailIgnoreCase(String email);

  @Query("select distinct u from User u join u.roles r where upper(r) = upper(:role)")
  java.util.List<User> findAllByRole(@Param("role") String role);
}
