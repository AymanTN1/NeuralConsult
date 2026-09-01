package com.neuralconsult.sevrage.community;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityServerRepository extends JpaRepository<CommunityServer, UUID> {
  List<CommunityServer> findAllByOrderByCreatedAtDesc();
  Optional<CommunityServer> findByNameIgnoreCase(String name);
}
