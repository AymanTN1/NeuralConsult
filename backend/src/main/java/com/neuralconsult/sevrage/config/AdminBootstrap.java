package com.neuralconsult.sevrage.config;

import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import java.util.Set;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminBootstrap {

  @Bean
  ApplicationRunner adminBootstrapRunner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
    return args -> userRepository.findByEmailIgnoreCase("admin@neuralconsult.ma").orElseGet(() -> {
      User admin = new User();
      admin.setEmail("admin@neuralconsult.ma");
      admin.setFullName("Administrateur NeuralConsult");
      admin.setPasswordHash(passwordEncoder.encode("Admin123!"));
      admin.setRoles(Set.of("ROLE_ADMIN"));
      admin.setStatus(User.UserStatus.ACTIVE);
      admin.setAccountEnabled(true);
      return userRepository.save(admin);
    });
  }
}
