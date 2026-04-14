package com.neuralconsult.sevrage.community;

import com.neuralconsult.sevrage.user.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityFollowRepository extends JpaRepository<CommunityFollow, UUID> {
  Optional<CommunityFollow> findByFollowerAndFollowed(User follower, User followed);
  boolean existsByFollowerAndFollowedAndActiveTrue(User follower, User followed);
  long countByFollowedAndActiveTrue(User followed);
}
