package com.neuralconsult.sevrage.community;

import com.neuralconsult.sevrage.common.auditing.AuditableEntity;
import com.neuralconsult.sevrage.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "community_server")
public class CommunityServer extends AuditableEntity {

  @Column(name = "name", nullable = false, length = 120)
  private String name;

  @Column(name = "description", length = 1000)
  private String description;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "created_by_user_id", nullable = false)
  private User createdByUser;

  @Enumerated(EnumType.STRING)
  @Column(name = "visibility", nullable = false, length = 24)
  private Visibility visibility = Visibility.PUBLIC;

  public enum Visibility {
    PUBLIC,
    PRIVATE
  }
}
