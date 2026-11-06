package com.gaio.calculadora.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient nominatimWebClient() {
        return WebClient.builder()
                .baseUrl("https://nominatim.openstreetmap.org")
                .defaultHeader("User-Agent", "gaio-calculadora-imobiliaria/1.0 (projeto academico)")
                .build();
    }

    @Bean
    @ConditionalOnProperty(prefix = "app.ml-service", name = "mock", havingValue = "false")
    public WebClient mlServiceWebClient(@Value("${app.ml-service.base-url}") String baseUrl) {
        return WebClient.builder().baseUrl(baseUrl).build();
    }
}
