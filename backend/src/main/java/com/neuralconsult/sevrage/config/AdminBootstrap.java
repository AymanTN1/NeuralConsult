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
    return args -> {
      User admin = userRepository.findByEmailIgnoreCase("admin@neuralconsult.ma").orElseGet(() -> {
        User u = new User();
        u.setEmail("admin@neuralconsult.ma");
        u.setFullName("Administrateur NeuralConsult");
        u.setStatus(User.UserStatus.ACTIVE);
        u.setAccountEnabled(true);
        return u;
      });
      admin.setPasswordHash(passwordEncoder.encode("password"));
      admin.setRoles(Set.of("ROLE_ADMIN", "ROLE_USER"));
      userRepository.save(admin);
    };
  }
}
