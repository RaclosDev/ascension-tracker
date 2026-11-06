package com.ascension.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class ImageFormatsTest {

    @Test
    void detectsJpegPngAndWebpByTheirFirstBytes() {
        assertThat(ImageFormats.detect(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0})).isEqualTo(ImageFormats.JPEG);
        assertThat(ImageFormats.detect(new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A}))
                .isEqualTo(ImageFormats.PNG);
        assertThat(ImageFormats.detect("RIFF\0\0\0\0WEBPVP8 ".getBytes(StandardCharsets.US_ASCII)))
                .isEqualTo(ImageFormats.WEBP);
    }

    @Test
    void rejectsTruncatedOrUnknownBytes() {
        assertThat(ImageFormats.detect(null)).isNull();
        assertThat(ImageFormats.detect(new byte[]{(byte) 0xFF, (byte) 0xD8})).isNull();
        assertThat(ImageFormats.detect("GIF89a".getBytes(StandardCharsets.US_ASCII))).isNull();
        assertThat(ImageFormats.detect("RIFF\0\0\0\0WAVE".getBytes(StandardCharsets.US_ASCII))).isNull();
    }
}
