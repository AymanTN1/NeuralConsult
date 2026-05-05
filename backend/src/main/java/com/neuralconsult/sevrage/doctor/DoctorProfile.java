package com.neuralconsult.sevrage.doctor;

import com.neuralconsult.sevrage.common.auditing.AuditableEntity;
import com.neuralconsult.sevrage.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "doctor_profile")
public class DoctorProfile extends AuditableEntity {

  @OneToOne(fetch = FetchType.EAGER, optional = false)
  @JoinColumn(name = "user_id", nullable = false, unique = true)
  private User user;

  @Column(name = "city", length = 80)
  private String city;

  @Column(name = "country_code", length = 64)
  private String countryCode;

  @Column(name = "specialty", length = 120)
  private String specialty;

  @Column(name = "bio", length = 2000)
  private String bio;

  @Column(name = "accepts_teleconsultation", nullable = false)
  private boolean acceptsTeleconsultation = true;

  @Column(name = "active", nullable = false)
  private boolean active = true;

  @Column(name = "years_experience")
  private Integer yearsExperience;

  @Column(name = "success_score")
  private Integer successScore;

  // ── Identification officielle ────────────────────────────────────────────
  @Column(name = "cin_number", length = 20)
  private String cinNumber;

  @Column(name = "cabinet_address", length = 300)
  private String cabinetAddress;

  // ── Identification professionnelle (bouclier juridique) ───────────────────
  @Column(name = "cnom_number", length = 50)
  private String cnomNumber;

  @Column(name = "inpe_number", length = 50)
  private String inpeNumber;

  // ── Documents de vérification ────────────────────────────────────────────
  @Column(name = "professional_card_uploaded", nullable = false)
  private boolean professionalCardUploaded = false;

  @Column(name = "cin_copy_uploaded", nullable = false)
  private boolean cinCopyUploaded = false;

  @Column(name = "documents_verified", nullable = false)
  private boolean documentsVerified = false;
}

