package com.neuralconsult.sevrage.notification;

import com.neuralconsult.sevrage.user.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<NotificationItem, UUID> {
  List<NotificationItem> findAllByUserOrderByCreatedAtDesc(User user);

  long countByUserAndStatus(User user, NotificationItem.Status status);

  Optional<NotificationItem> findByUserAndDedupeKey(User user, String dedupeKey);

  Optional<NotificationItem> findByIdAndUser(UUID id, User user);
}
