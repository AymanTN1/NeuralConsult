package com.neuralconsult.sevrage.user;

import com.neuralconsult.sevrage.security.dto.RegisterRequest;
import jakarta.transaction.Transactional;
import java.util.Set;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Transactional
  public User register(RegisterRequest request) {
    userRepository.findByEmailIgnoreCase(request.email())
        .ifPresent(existing -> {
          throw new IllegalArgumentException("Email already in use");
        });

    User user = new User();
    user.setEmail(request.email().toLowerCase());
    user.setFullName(request.fullName());
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setRoles(Set.of("ROLE_USER"));

    return userRepository.save(user);
  }
}
