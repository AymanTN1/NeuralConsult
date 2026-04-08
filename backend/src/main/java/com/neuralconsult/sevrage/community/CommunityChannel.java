package com.neuralconsult.sevrage.community;

import com.neuralconsult.sevrage.common.auditing.AuditableEntity;
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
@Table(name = "community_channel")
public class CommunityChannel extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "server_id", nullable = false)
  private CommunityServer server;

  @Column(name = "name", nullable = false, length = 120)
  private String name;

  @Column(name = "description", length = 600)
  private String description;

  @Enumerated(EnumType.STRING)
  @Column(name = "channel_type", nullable = false, length = 24)
  private ChannelType channelType = ChannelType.TEXT;

  public enum ChannelType {
    TEXT
  }
}
