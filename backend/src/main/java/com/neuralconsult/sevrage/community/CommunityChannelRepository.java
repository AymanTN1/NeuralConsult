package com.neuralconsult.sevrage.community;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityChannelRepository extends JpaRepository<CommunityChannel, UUID> {
  List<CommunityChannel> findAllByServerOrderByCreatedAtAsc(CommunityServer server);
}
