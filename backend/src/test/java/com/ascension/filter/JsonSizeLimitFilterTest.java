package com.ascension.filter;

import jakarta.servlet.FilterChain;
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
        var request = new MockHttpServletRequest("POST", "/api/user/restore");
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
        var request = new MockHttpServletRequest("POST", "/api/user/restore") {
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
}
