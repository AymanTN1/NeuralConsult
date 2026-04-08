package com.neuralconsult.sevrage.support;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportMessageRepository extends JpaRepository<SupportMessage, UUID> {
  List<SupportMessage> findAllByConversationOrderByCreatedAtAsc(SupportConversation conversation);
}
