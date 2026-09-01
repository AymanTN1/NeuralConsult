package com.neuralconsult.sevrage.community;

import com.neuralconsult.sevrage.user.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityPostReactionRepository extends JpaRepository<CommunityPostReaction, UUID> {
  Optional<CommunityPostReaction> findByPostAndUser(CommunityPost post, User user);
  List<CommunityPostReaction> findAllByPost(CommunityPost post);
  List<CommunityPostReaction> findAllByPostAuthorOrderByCreatedAtDesc(User author);
  long countByPostAuthor(User author);
}
