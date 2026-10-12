package com.ascension.config;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.HttpURLConnection;
import java.util.Collections;

@Configuration
public class GoogleAuthConfig {

    @Value("${google.client-id:CHANGE_ME}")
    private String googleClientId;

    @Bean
    public GoogleIdTokenVerifier googleIdTokenVerifier(ExternalApiProperties properties) {
        int connectTimeout = properties.getGoogle() != null ? properties.getGoogle().getConnectTimeoutMs() : 5000;
        int readTimeout = properties.getGoogle() != null ? properties.getGoogle().getReadTimeoutMs() : 5000;

        NetHttpTransport transport = new NetHttpTransport.Builder()
                .setConnectionFactory(url -> {
                    HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                    connection.setConnectTimeout(connectTimeout);
                    connection.setReadTimeout(readTimeout);
                    return connection;
                })
                .build();

        return new GoogleIdTokenVerifier.Builder(transport, new GsonFactory())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }
}
