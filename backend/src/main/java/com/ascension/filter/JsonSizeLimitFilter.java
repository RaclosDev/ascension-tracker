package com.ascension.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.io.InputStream;

@Component
public class JsonSizeLimitFilter extends OncePerRequestFilter {

    private static final long MAX_JSON_PAYLOAD_SIZE = 5 * 1024 * 1024; // 5 MB

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String contentType = request.getContentType();
        if (contentType != null && contentType.toLowerCase().contains("application/json")) {
            long contentLength = request.getContentLengthLong();
            
            // Fast fail si el Content-Length ya declara que es muy grande
            if (contentLength > MAX_JSON_PAYLOAD_SIZE) {
                response.setStatus(HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE);
                response.getWriter().write("Payload Too Large: JSON body exceeds limit.");
                return;
            }

            // Wrapper para proteger contra Transfer-Encoding: chunked (contentLength == -1)
            HttpServletRequest wrappedRequest = new HttpServletRequestWrapper(request) {
                @Override
                public ServletInputStream getInputStream() throws IOException {
                    return new LimitedServletInputStream(super.getInputStream(), MAX_JSON_PAYLOAD_SIZE);
                }
            };
            filterChain.doFilter(wrappedRequest, response);
            return;
        }
        
        filterChain.doFilter(request, response);
    }

    private static class LimitedServletInputStream extends ServletInputStream {
        private final ServletInputStream original;
        private final long limit;
        private long count = 0;

        public LimitedServletInputStream(ServletInputStream original, long limit) {
            this.original = original;
            this.limit = limit;
        }

        private void checkLimit(long readBytes) throws IOException {
            if (readBytes > 0) {
                count += readBytes;
                if (count > limit) {
                    throw new IOException("JSON payload exceeded maximum size limit of " + limit + " bytes");
                }
            }
        }

        @Override
        public int read() throws IOException {
            int res = original.read();
            if (res != -1) {
                checkLimit(1);
            }
            return res;
        }

        @Override
        public int read(byte[] b, int off, int len) throws IOException {
            int res = original.read(b, off, len);
            checkLimit(res);
            return res;
        }

        @Override
        public boolean isFinished() {
            return original.isFinished();
        }

        @Override
        public boolean isReady() {
            return original.isReady();
        }

        @Override
        public void setReadListener(ReadListener readListener) {
            original.setReadListener(readListener);
        }
    }
}
