package com.neuralconsult.sevrage.common.auditing;

import java.time.Instant;
import java.util.UUID;
import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Getter
@Setter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class AuditableEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Setter(AccessLevel.NONE)
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @CreatedDate
  @Setter(AccessLevel.NONE)
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @LastModifiedDate
  @Setter(AccessLevel.NONE)
  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @CreatedBy
  @Setter(AccessLevel.NONE)
  @Column(name = "created_by", nullable = false, updatable = false, length = 64)
  private String createdBy;

  @LastModifiedBy
  @Setter(AccessLevel.NONE)
  @Column(name = "updated_by", nullable = false, length = 64)
  private String updatedBy;

  @Version
  @Setter(AccessLevel.NONE)
  @Column(name = "row_version", nullable = false)
  private Long rowVersion;

  @Setter(AccessLevel.NONE)
  @Column(name = "deleted_at")
  private Instant deletedAt;

  @Setter(AccessLevel.NONE)
  @Column(name = "deleted_by", length = 64)
  private String deletedBy;

  public void markDeleted(String actor) {
    this.deletedAt = Instant.now();
    this.deletedBy = actor;
  }
}
