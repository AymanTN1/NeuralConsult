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
@Table(name = "community_post")
public class CommunityPost extends AuditableEntity {

  public enum PostType {
    USER_POST,       // Normal user post
    OFFICIAL_NEWS    // Auto-posted by @neuralconsult.sevrage scraper
  }

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "author_user_id", nullable = false)
  private User author;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "server_id")
  private CommunityServer server;

  @Column(name = "content", nullable = false, length = 5000)
  private String content;

  @Column(name = "image_url", length = 2000000)
  private String imageUrl;

  @Enumerated(EnumType.STRING)
  @Column(name = "post_type", nullable = false, length = 24)
  private PostType postType = PostType.USER_POST;

  /** Original article URL for OFFICIAL_NEWS posts */
  @Column(name = "source_url", length = 2000)
  private String sourceUrl;

  /** Display label of the source website */
  @Column(name = "source_label", length = 200)
  private String sourceLabel;
}
