package com.neuralconsult.sevrage.community;

import com.neuralconsult.sevrage.user.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityCommentReactionRepository extends JpaRepository<CommunityCommentReaction, UUID> {

  Optional<CommunityCommentReaction> findByCommentAndUser(CommunityPostComment comment, User user);

  List<CommunityCommentReaction> findAllByComment(CommunityPostComment comment);

  List<CommunityCommentReaction> findAllByCommentIn(List<CommunityPostComment> comments);

  long countByCommentAndType(CommunityPostComment comment, CommunityPostReaction.ReactionType type);
}
