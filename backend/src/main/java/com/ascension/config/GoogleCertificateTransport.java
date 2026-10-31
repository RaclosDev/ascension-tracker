package com.ascension.config;

import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.LowLevelHttpRequest;
import com.google.api.client.http.LowLevelHttpResponse;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** GET-only transport for Google's cached public certificates; configured deadlines are authoritative. */
final class GoogleCertificateTransport extends HttpTransport {
    private final int connectTimeout;
    private final int readTimeout;
    GoogleCertificateTransport(int connectTimeout, int readTimeout) {
        if (connectTimeout <= 0 || readTimeout <= 0) throw new IllegalArgumentException("Google timeouts must be positive");
        this.connectTimeout = connectTimeout;
        this.readTimeout = readTimeout;
    }
    @Override public boolean supportsMethod(String method) { return "GET".equals(method); }
    @Override protected LowLevelHttpRequest buildRequest(String method, String url) throws IOException {
        if (!supportsMethod(method)) throw new IOException("Certificate transport only supports GET");
        var connection = (HttpURLConnection) URI.create(url).toURL().openConnection();
        connection.setRequestMethod("GET");
        connection.setConnectTimeout(connectTimeout);
        connection.setReadTimeout(readTimeout);
        // Let the Google client handle redirects and limit their count.
        connection.setInstanceFollowRedirects(false);
        return new LowLevelHttpRequest() {
            @Override public void addHeader(String name, String value) { connection.addRequestProperty(name, value); }
            @Override public void setTimeout(int ignoredConnect, int ignoredRead) {
                // Google HttpRequest passes its own defaults; retain the application deadlines.
            }
            @Override public LowLevelHttpResponse execute() throws IOException {
                try {
                    connection.getResponseCode();
                    return new CertificateResponse(connection);
                } catch (IOException e) { connection.disconnect(); throw e; }
            }
        };
    }
    private static final class CertificateResponse extends LowLevelHttpResponse {
        private final HttpURLConnection connection;
        private final List<Map.Entry<String, String>> headers = new ArrayList<>();
        CertificateResponse(HttpURLConnection connection) {
            this.connection = connection;
            connection.getHeaderFields().forEach((name, values) -> {
                if (name != null) values.forEach(value -> headers.add(Map.entry(name, value)));
            });
        }
        @Override public InputStream getContent() throws IOException {
            return connection.getResponseCode() >= 400 ? connection.getErrorStream() : connection.getInputStream();
        }
        @Override public String getContentEncoding() { return connection.getContentEncoding(); }
        @Override public long getContentLength() { return connection.getContentLengthLong(); }
        @Override public String getContentType() { return connection.getContentType(); }
        @Override public String getStatusLine() { return connection.getHeaderField(null); }
        @Override public int getStatusCode() throws IOException { return connection.getResponseCode(); }
        @Override public String getReasonPhrase() throws IOException { return connection.getResponseMessage(); }
        @Override public int getHeaderCount() { return headers.size(); }
        @Override public String getHeaderName(int index) { return headers.get(index).getKey(); }
        @Override public String getHeaderValue(int index) { return headers.get(index).getValue(); }
        @Override public void disconnect() { connection.disconnect(); }
    }
}
