package com.neuralconsult.sevrage.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.Map;
import javax.crypto.SecretKey;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  private final JwtProperties properties;
  private final SecretKey key;

  public JwtService(JwtProperties properties) {
    this.properties = properties;
    this.key = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
  }

  public String generateAccessToken(UserDetails userDetails) {
    Instant now = Instant.now();
    Instant expiry = now.plus(properties.accessTokenMinutes(), ChronoUnit.MINUTES);

    return Jwts.builder()
        .setIssuer(properties.issuer())
        .setSubject(userDetails.getUsername())
        .setIssuedAt(Date.from(now))
        .setExpiration(Date.from(expiry))
        .addClaims(Map.of("roles", extractRoles(userDetails)))
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  public String extractUsername(String token) {
    return parseAllClaims(token).getSubject();
  }

  public boolean isTokenValid(String token, UserDetails userDetails) {
    String username = extractUsername(token);
    return username != null && username.equalsIgnoreCase(userDetails.getUsername()) && !isExpired(token);
  }

  private boolean isExpired(String token) {
    return parseAllClaims(token).getExpiration().before(new Date());
  }

  private Claims parseAllClaims(String token) {
    return Jwts.parserBuilder()
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token)
        .getBody();
  }

  private List<String> extractRoles(UserDetails userDetails) {
    return userDetails.getAuthorities()
        .stream()
        .map(grantedAuthority -> grantedAuthority.getAuthority())
        .toList();
  }
}
