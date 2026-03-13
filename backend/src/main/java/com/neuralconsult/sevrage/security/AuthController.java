package com.neuralconsult.sevrage.security;

import com.neuralconsult.sevrage.patient.PatientProfileService;
import com.neuralconsult.sevrage.security.dto.LoginRequest;
import com.neuralconsult.sevrage.security.dto.RegisterRequest;
import com.neuralconsult.sevrage.security.dto.TokenResponse;
import com.neuralconsult.sevrage.user.User;
import com.neuralconsult.sevrage.user.UserService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthenticationManager authenticationManager;
  private final JwtService jwtService;
  private final JwtProperties jwtProperties;
  private final UserService userService;
  private final PatientProfileService patientProfileService;

  public AuthController(AuthenticationManager authenticationManager,
                        JwtService jwtService,
                        JwtProperties jwtProperties,
                        UserService userService,
                        PatientProfileService patientProfileService) {
    this.authenticationManager = authenticationManager;
    this.jwtService = jwtService;
    this.jwtProperties = jwtProperties;
    this.userService = userService;
    this.patientProfileService = patientProfileService;
  }

  @PostMapping("/register")
  public ResponseEntity<TokenResponse> register(@Valid @RequestBody RegisterRequest request,
                                                HttpServletResponse response) {
    User user = userService.register(request);
    patientProfileService.getOrCreate(user);

    Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(request.email(), request.password())
    );

    UserDetails userDetails = (UserDetails) authentication.getPrincipal();
    String token = jwtService.generateAccessToken(userDetails);
    Instant expiresAt = Instant.now().plus(jwtProperties.accessTokenMinutes(), ChronoUnit.MINUTES);

    ResponseCookie cookie = ResponseCookie.from("NC_ACCESS", token)
        .httpOnly(true)
        .secure(jwtProperties.cookieSecure())
        .sameSite("Strict")
        .path("/")
        .maxAge(jwtProperties.accessTokenMinutes() * 60)
        .build();

    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

    return ResponseEntity.ok(new TokenResponse(token, expiresAt));
  }

  @PostMapping("/login")
  public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request,
                                             HttpServletResponse response) {
    Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(request.email(), request.password())
    );

    UserDetails userDetails = (UserDetails) authentication.getPrincipal();
    String token = jwtService.generateAccessToken(userDetails);
    Instant expiresAt = Instant.now().plus(jwtProperties.accessTokenMinutes(), ChronoUnit.MINUTES);

    ResponseCookie cookie = ResponseCookie.from("NC_ACCESS", token)
        .httpOnly(true)
        .secure(jwtProperties.cookieSecure())
        .sameSite("Strict")
        .path("/")
        .maxAge(jwtProperties.accessTokenMinutes() * 60)
        .build();

    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

    return ResponseEntity.ok(new TokenResponse(token, expiresAt));
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(HttpServletResponse response) {
    ResponseCookie cookie = ResponseCookie.from("NC_ACCESS", "")
        .httpOnly(true)
        .secure(jwtProperties.cookieSecure())
        .sameSite("Strict")
        .path("/")
        .maxAge(0)
        .build();

    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    return ResponseEntity.noContent().build();
  }
}
