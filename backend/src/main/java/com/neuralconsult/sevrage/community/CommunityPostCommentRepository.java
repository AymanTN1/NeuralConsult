package com.neuralconsult.sevrage.community;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityPostCommentRepository extends JpaRepository<CommunityPostComment, UUID> {
  List<CommunityPostComment> findAllByPostOrderByCreatedAtAsc(CommunityPost post);
  List<CommunityPostComment> findAllByPostAuthorOrderByCreatedAtDesc(com.neuralconsult.sevrage.user.User author);
}
