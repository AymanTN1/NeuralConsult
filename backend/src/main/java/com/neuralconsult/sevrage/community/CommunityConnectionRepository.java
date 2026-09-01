package com.neuralconsult.sevrage.community;

import com.neuralconsult.sevrage.user.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommunityConnectionRepository extends JpaRepository<CommunityConnection, UUID> {
  Optional<CommunityConnection> findByRequesterAndReceiver(User requester, User receiver);

  @Query("select c from CommunityConnection c where ((c.requester = :a and c.receiver = :b) or (c.requester = :b and c.receiver = :a))")
  Optional<CommunityConnection> findBetween(@Param("a") User a, @Param("b") User b);

  List<CommunityConnection> findAllByReceiverAndStatusOrderByCreatedAtDesc(User receiver, CommunityConnection.Status status);

  @Query("select c from CommunityConnection c where (c.requester = :user or c.receiver = :user) and c.status = :status order by c.updatedAt desc")
  List<CommunityConnection> findAllForUserByStatus(@Param("user") User user, @Param("status") CommunityConnection.Status status);
}
