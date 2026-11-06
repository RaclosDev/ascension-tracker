package com.ascension.filter;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import java.io.IOException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JsonSizeLimitFilterTest {
    @ParameterizedTest
    @ValueSource(strings = {"application/json", "application/vnd.api+json", "application/problem+json; charset=UTF-8", "APPLICATION/JSON"})
    void rejectsOversizedJsonRegardlessOfSubtype(String contentType) throws Exception {
        var request = new MockHttpServletRequest("POST", "/api/workouts");
        request.setContentType(contentType);
        request.setContent(new byte[5 * 1024 * 1024 + 1]);
        var response = new MockHttpServletResponse();
        var chain = mock(FilterChain.class);
        new JsonSizeLimitFilter().doFilter(request, response, chain);
        assertEquals(413, response.getStatus());
        verifyNoInteractions(chain);
    }

    @ParameterizedTest
    @ValueSource(strings = {"application/json", "application/vnd.api+json"})
    void limitsChunkedJsonWithoutContentLength(String contentType) {
        var request = new MockHttpServletRequest("POST", "/api/workouts") {
            @Override public long getContentLengthLong() { return -1; }
        };
        request.setContentType(contentType);
        request.setContent(new byte[5 * 1024 * 1024 + 1]);
        assertThrows(IOException.class, () -> new JsonSizeLimitFilter().doFilter(request,
            new MockHttpServletResponse(), (wrapped, response) -> wrapped.getInputStream().readAllBytes()));
    }

    @ParameterizedTest
    @ValueSource(strings = {"application/json", "application/vnd.api+json", "text/plain", "invalid"})
    void passesSmallRequestsThrough(String contentType) throws Exception {
        var request = new MockHttpServletRequest("POST", "/api/example");
        request.setContentType(contentType);
        request.setContent("{}".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        var response = new MockHttpServletResponse();
        new JsonSizeLimitFilter().doFilter(request, response,
            (wrapped, result) -> assertArrayEquals(request.getContentAsByteArray(), wrapped.getInputStream().readAllBytes()));
        assertEquals(200, response.getStatus());
    }

    @Test
    void restoreAcceptsBackupsLargerThanTheGeneralLimit() throws Exception {
        byte[] backup = new byte[8 * 1024 * 1024];
        var request = new MockHttpServletRequest("POST", "/api/user/restore");
        request.setContentType("application/json");
        request.setContent(backup);
        var response = new MockHttpServletResponse();
        new JsonSizeLimitFilter().doFilter(request, response,
            (wrapped, result) -> assertEquals(backup.length, wrapped.getInputStream().readAllBytes().length));
        assertEquals(200, response.getStatus());
    }

    @Test
    void restoreDecompressesGzipAndHidesTheEncoding() throws Exception {
        byte[] json = "{\"version\":\"1.0\",\"workouts\":[]}".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        var request = new MockHttpServletRequest("POST", "/api/user/restore");
        request.setContentType("application/json");
        request.addHeader("Content-Encoding", "gzip");
        request.setContent(gzip(json));
        new JsonSizeLimitFilter().doFilter(request, new MockHttpServletResponse(), (wrapped, result) -> {
            var http = (jakarta.servlet.http.HttpServletRequest) wrapped;
            assertNull(http.getHeader("Content-Encoding"));
            assertEquals(-1, http.getContentLengthLong());
            assertArrayEquals(json, http.getInputStream().readAllBytes());
        });
    }

    @Test
    void gzipLimitAppliesToTheDecompressedBackup() throws Exception {
        // Zeros compress to almost nothing: the limit must still count the expanded JSON.
        var request = new MockHttpServletRequest("POST", "/api/user/restore");
        request.setContentType("application/json");
        request.addHeader("Content-Encoding", "gzip");
        request.setContent(gzip(new byte[(int) JsonSizeLimitFilter.MAX_RESTORE_PAYLOAD_SIZE + 1]));
        assertThrows(IOException.class, () -> new JsonSizeLimitFilter().doFilter(request,
            new MockHttpServletResponse(), (wrapped, response) -> wrapped.getInputStream().readAllBytes()));
    }

    @Test
    void gzipIsIgnoredOutsideTheRestoreEndpoint() throws Exception {
        byte[] body = gzip("{}".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        var request = new MockHttpServletRequest("POST", "/api/workouts");
        request.setContentType("application/json");
        request.addHeader("Content-Encoding", "gzip");
        request.setContent(body);
        new JsonSizeLimitFilter().doFilter(request, new MockHttpServletResponse(),
            (wrapped, result) -> assertArrayEquals(body, wrapped.getInputStream().readAllBytes()));
    }

    private static byte[] gzip(byte[] plain) throws IOException {
        var out = new java.io.ByteArrayOutputStream();
        try (var gz = new java.util.zip.GZIPOutputStream(out)) {
            gz.write(plain);
        }
        return out.toByteArray();
    }
}
