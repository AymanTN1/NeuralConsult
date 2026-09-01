package com.neuralconsult.sevrage.community;

import com.neuralconsult.sevrage.user.User;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommunityDirectMessageRepository extends JpaRepository<CommunityDirectMessage, UUID> {
  @Query("select m from CommunityDirectMessage m where (m.sender = :a and m.recipient = :b) or (m.sender = :b and m.recipient = :a) order by m.createdAt asc")
  List<CommunityDirectMessage> findThread(@Param("a") User a, @Param("b") User b);

  @Query("select m from CommunityDirectMessage m where m.sender = :user or m.recipient = :user order by m.createdAt desc")
  List<CommunityDirectMessage> findRecentForUser(@Param("user") User user);
}
