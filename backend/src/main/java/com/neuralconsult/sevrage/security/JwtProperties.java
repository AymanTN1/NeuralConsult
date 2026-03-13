package com.neuralconsult.sevrage.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "security.jwt")
public record JwtProperties(
    String secret,
    String issuer,
    long accessTokenMinutes,
    long refreshTokenDays,
    boolean cookieSecure
) {
}
