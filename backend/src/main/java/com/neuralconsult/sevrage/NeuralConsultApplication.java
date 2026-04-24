package com.neuralconsult.sevrage;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.util.TimeZone;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class NeuralConsultApplication {
  public static void main(String[] args) {
    TimeZone.setDefault(TimeZone.getTimeZone("Africa/Casablanca"));
    SpringApplication.run(NeuralConsultApplication.class, args);
  }
}
