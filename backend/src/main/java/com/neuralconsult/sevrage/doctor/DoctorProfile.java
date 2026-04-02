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
}
