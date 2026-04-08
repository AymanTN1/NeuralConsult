package com.neuralconsult.sevrage.community;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityMessageRepository extends JpaRepository<CommunityMessage, UUID> {
  List<CommunityMessage> findAllByChannelOrderByCreatedAtAsc(CommunityChannel channel);
}
