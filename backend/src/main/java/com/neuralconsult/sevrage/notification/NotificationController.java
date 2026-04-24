package com.neuralconsult.sevrage.notification;

import com.neuralconsult.sevrage.notification.dto.NotificationResponse;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

  private final NotificationService notificationService;
  private final UserRepository userRepository;

  public NotificationController(NotificationService notificationService, UserRepository userRepository) {
    this.notificationService = notificationService;
    this.userRepository = userRepository;
  }

  @GetMapping
  public List<NotificationResponse> list(@AuthenticationPrincipal UserDetails principal) {
    return notificationService.list(currentUser(principal));
  }

  @GetMapping("/summary")
  public Map<String, Long> summary(@AuthenticationPrincipal UserDetails principal) {
    return Map.of("unreadCount", notificationService.unreadCount(currentUser(principal)));
  }

  @PostMapping("/{id}/read")
  public NotificationResponse markRead(@AuthenticationPrincipal UserDetails principal,
                                       @PathVariable UUID id) {
    return notificationService.markRead(currentUser(principal), id);
  }

  private User currentUser(UserDetails principal) {
    return userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
  }
}
