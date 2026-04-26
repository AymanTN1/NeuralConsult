package com.neuralconsult.sevrage.community;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, UUID> {
  List<CommunityPost> findTop120ByDeletedAtIsNullOrderByCreatedAtDesc();
  List<CommunityPost> findAllByAuthorAndDeletedAtIsNullOrderByCreatedAtDesc(com.neuralconsult.sevrage.user.User author);
}
