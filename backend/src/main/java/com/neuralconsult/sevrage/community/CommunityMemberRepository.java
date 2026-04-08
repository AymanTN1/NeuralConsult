package com.neuralconsult.sevrage.community;

import com.neuralconsult.sevrage.user.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityMemberRepository extends JpaRepository<CommunityMember, UUID> {
  Optional<CommunityMember> findByServerAndUser(CommunityServer server, User user);

  List<CommunityMember> findAllByServerAndActiveTrue(CommunityServer server);
}
