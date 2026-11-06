package com.ascension.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.http.MediaType;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.zip.GZIPInputStream;

@Component
public class JsonSizeLimitFilter extends OncePerRequestFilter {

    private static final long MAX_JSON_PAYLOAD_SIZE = 5 * 1024 * 1024;

    /** A backup of an account at its quotas is far larger than any other request. */
    static final String RESTORE_PATH = "/api/user/restore";
    public static final long MAX_RESTORE_PAYLOAD_SIZE = 25L * 1024 * 1024;

    /** Largest JSON body, after decompression, accepted on this path. */
    public static long maxJsonBytes(String requestUri) {
        return RESTORE_PATH.equals(requestUri) ? MAX_RESTORE_PAYLOAD_SIZE : MAX_JSON_PAYLOAD_SIZE;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String contentType = request.getContentType();
        if (isJson(contentType)) {
            long limit = maxJsonBytes(request.getRequestURI());
            long contentLength = request.getContentLengthLong();

            if (contentLength > limit) {
                response.setStatus(HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE);
                response.getWriter().write("Payload Too Large: JSON body exceeds limit.");
                return;
            }

            // Only the backup upload is sent gzipped; the limit then applies to the decompressed JSON.
            boolean gzipped = RESTORE_PATH.equals(request.getRequestURI())
                    && "gzip".equalsIgnoreCase(String.valueOf(request.getHeader("Content-Encoding")).trim());

            // Wrapper para proteger contra Transfer-Encoding: chunked (contentLength == -1)
            HttpServletRequest wrappedRequest = gzipped
                    ? new GzipRequest(request, limit)
                    : new HttpServletRequestWrapper(request) {
                        @Override
                        public ServletInputStream getInputStream() throws IOException {
                            return new LimitedServletInputStream(super.getInputStream(), limit);
                        }
                    };
            filterChain.doFilter(wrappedRequest, response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    /** Decompresses the body and hides the encoding, so the JSON converter sees plain JSON. */
    private static final class GzipRequest extends HttpServletRequestWrapper {
        private final long limit;

        GzipRequest(HttpServletRequest request, long limit) {
            super(request);
            this.limit = limit;
        }

        @Override
        public ServletInputStream getInputStream() throws IOException {
            InputStream decompressed = new GZIPInputStream(super.getInputStream(), 8192);
            return new LimitedServletInputStream(new InputStreamServletInputStream(decompressed), limit);
        }

        @Override
        public String getHeader(String name) {
            if ("Content-Encoding".equalsIgnoreCase(name)) return null;
            if ("Content-Length".equalsIgnoreCase(name)) return null;
            return super.getHeader(name);
        }

        @Override
        public Enumeration<String> getHeaders(String name) {
            if ("Content-Encoding".equalsIgnoreCase(name) || "Content-Length".equalsIgnoreCase(name)) {
                return Collections.emptyEnumeration();
            }
            return super.getHeaders(name);
        }

        @Override
        public Enumeration<String> getHeaderNames() {
            List<String> names = Collections.list(super.getHeaderNames());
            names.removeIf(n -> "Content-Encoding".equalsIgnoreCase(n) || "Content-Length".equalsIgnoreCase(n));
            return Collections.enumeration(names);
        }

        @Override
        public int getContentLength() {
            return -1;
        }

        @Override
        public long getContentLengthLong() {
            return -1;
        }
    }

    private static final class InputStreamServletInputStream extends ServletInputStream {
        private final InputStream delegate;
        private boolean finished;

        InputStreamServletInputStream(InputStream delegate) {
            this.delegate = delegate;
        }

        @Override
        public int read() throws IOException {
            int b = delegate.read();
            if (b == -1) finished = true;
            return b;
        }

        @Override
        public int read(byte[] b, int off, int len) throws IOException {
            int n = delegate.read(b, off, len);
            if (n == -1) finished = true;
            return n;
        }

        @Override
        public boolean isFinished() {
            return finished;
        }

        @Override
        public boolean isReady() {
            return true;
        }

        @Override
        public void setReadListener(ReadListener readListener) {
            throw new IllegalStateException("Gzipped uploads are read synchronously");
        }

        @Override
        public void close() throws IOException {
            delegate.close();
        }
    }

    private static boolean isJson(String contentType) {
        if (contentType == null) return false;
        try {
            MediaType mediaType = MediaType.parseMediaType(contentType);
            return MediaType.APPLICATION_JSON.includes(mediaType)
                    || new MediaType("application", "*+json").includes(mediaType);
        } catch (InvalidMediaTypeException ignored) {
            // The request mapping/converter remains responsible for invalid content types.
            return false;
        }
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
