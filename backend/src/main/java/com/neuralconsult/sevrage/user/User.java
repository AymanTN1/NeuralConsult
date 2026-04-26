package com.neuralconsult.sevrage.user;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.neuralconsult.sevrage.common.auditing.AuditableEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Comment;

@Getter
@Setter
@Entity
@Table(name = "app_user", indexes = {
  @Index(name = "idx_user_email", columnList = "email")
})
public class User extends AuditableEntity {

  @Column(name = "email", nullable = false, unique = true, length = 190)
  private String email;

  @JsonIgnore
  @Comment("BCrypt/Argon2 hash")
  @Column(name = "password_hash", nullable = false, length = 255)
  private String passwordHash;

  @Column(name = "full_name", length = 120)
  private String fullName;

  @Column(name = "first_name", length = 80)
  private String firstName;

  @Column(name = "last_name", length = 80)
  private String lastName;

  @Column(name = "date_of_birth")
  private LocalDate dateOfBirth;

  @Column(name = "phone_number", length = 32)
  private String phoneNumber;

  @Column(name = "identity_document_type", length = 24)
  private String identityDocumentType;

  @Column(name = "identity_verified", nullable = false)
  private boolean identityVerified;

  @Column(name = "identity_verified_at")
  private Instant identityVerifiedAt;

  @Column(name = "identity_verification_summary", length = 600)
  private String identityVerificationSummary;

  @Column(name = "community_username", unique = true, length = 40)
  private String communityUsername;

  @Lob
  @Column(name = "community_avatar_url")
  private String communityAvatarUrl;

  @Column(name = "community_bio", length = 320)
  private String communityBio;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 24)
  private UserStatus status = UserStatus.ACTIVE;

  @Column(name = "account_enabled", nullable = false)
  private boolean accountEnabled = true;

  @Column(name = "account_locked", nullable = false)
  private boolean accountLocked = false;

  @Column(name = "mfa_enabled", nullable = false)
  private boolean mfaEnabled = false;

  @Column(name = "last_login_at")
  private Instant lastLoginAt;

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
  @Column(name = "role", nullable = false, length = 50)
  private Set<String> roles = new HashSet<>();

  public enum UserStatus {
    ACTIVE,
    SUSPENDED,
    PENDING_VERIFICATION
  }
}
