package com.ascension.config;

import com.google.api.client.http.GenericUrl;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.SocketTimeoutException;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;

class GoogleTransportTimeoutTest {
    @Test void certificateBodyAndCacheHeadersSurviveRedirects() throws Exception {
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/redirect", exchange -> {
            exchange.getResponseHeaders().add("Location", "/certificates");
            exchange.sendResponseHeaders(302, -1);
            exchange.close();
        });
        server.createContext("/certificates", exchange -> {
            exchange.getResponseHeaders().add("Cache-Control", "public, max-age=3600");
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            byte[] body = "{\"key\":\"certificate\"}".getBytes(java.nio.charset.StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
        try {
            var transport = new GoogleCertificateTransport(1000, 1000);
            var response = transport.createRequestFactory().buildGetRequest(
                    new GenericUrl("http://127.0.0.1:" + server.getAddress().getPort() + "/redirect")).execute();
            try {
                assertThat(response.getStatusCode()).isEqualTo(200);
                assertThat(response.getHeaders().getCacheControl()).isEqualTo("public, max-age=3600");
                assertThat(response.parseAsString()).isEqualTo("{\"key\":\"certificate\"}");
            } finally { response.disconnect(); }
        } finally { server.stop(0); }
    }

    @Test void libraryDefaultsCannotOverrideConfiguredReadDeadline() throws Exception {
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/slow", exchange -> {
            try {
                Thread.sleep(300);
                exchange.sendResponseHeaders(200, 2);
                exchange.getResponseBody().write("{}".getBytes());
            } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            finally { exchange.close(); }
        });
        server.start();
        try {
            var properties = new ExternalApiProperties();
            properties.getGoogle().setReadTimeoutMs(40);
            var transport = new GoogleAuthConfig().googleIdTokenVerifier(properties).getTransport();
            var request = transport.createRequestFactory().buildGetRequest(new GenericUrl("http://127.0.0.1:" + server.getAddress().getPort() + "/slow"));
            assertThatThrownBy(request::execute).isInstanceOf(SocketTimeoutException.class);
        } finally { server.stop(0); }
    }
}
