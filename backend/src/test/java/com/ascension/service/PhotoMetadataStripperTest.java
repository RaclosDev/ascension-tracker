package com.ascension.service;

import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class PhotoMetadataStripperTest {

    @Test
    void jpegLosesItsExifSegmentButKeepsTheRest() {
        byte[] app0 = segment(0xE0, "JFIF\0".getBytes(StandardCharsets.US_ASCII));
        byte[] exif = segment(0xE1, "Exif\0\0GPS-SECRET".getBytes(StandardCharsets.US_ASCII));
        byte[] sos = {(byte) 0xFF, (byte) 0xDA, 0, 2, 1, 2, 3, (byte) 0xFF, (byte) 0xD9};
        byte[] input = concat(new byte[]{(byte) 0xFF, (byte) 0xD8}, app0, exif, sos);

        byte[] out = PhotoMetadataStripper.strip(input, "image/jpeg");

        assertThat(out).isEqualTo(concat(new byte[]{(byte) 0xFF, (byte) 0xD8}, app0, sos));
        assertThat(new String(out, StandardCharsets.ISO_8859_1)).doesNotContain("GPS-SECRET");
    }

    @Test
    void webpLosesExifAndXmpChunksAndTheirFlags() {
        byte[] vp8x = chunk("VP8X", new byte[]{0x0C, 0, 0, 0, 0, 0, 0, 0, 0, 0});
        byte[] image = chunk("VP8 ", new byte[]{1, 2, 3, 4});
        byte[] exif = chunk("EXIF", "GPS-SECRET!".getBytes(StandardCharsets.US_ASCII));
        byte[] xmp = chunk("XMP ", "<x/>".getBytes(StandardCharsets.US_ASCII));
        byte[] input = riff(vp8x, image, exif, xmp);

        byte[] out = PhotoMetadataStripper.strip(input, "image/webp");

        byte[] cleanVp8x = chunk("VP8X", new byte[10]);
        assertThat(out).isEqualTo(riff(cleanVp8x, image));
        assertThat(ProgressPhotoService.contentType(out)).isEqualTo("image/webp");
    }

    @Test
    void filesWithoutMetadataOrWithBrokenStructureAreLeftAlone() {
        byte[] truncated = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16, 'J', 'F', 'I', 'F'};
        assertThat(PhotoMetadataStripper.strip(truncated, "image/jpeg")).isSameAs(truncated);
        byte[] plain = riff(chunk("VP8 ", new byte[]{1, 2}));
        assertThat(PhotoMetadataStripper.strip(plain, "image/webp")).isSameAs(plain);
    }

    private static byte[] segment(int marker, byte[] payload) {
        int length = payload.length + 2;
        return concat(new byte[]{(byte) 0xFF, (byte) marker, (byte) (length >> 8), (byte) length}, payload);
    }

    private static byte[] chunk(String fourcc, byte[] payload) {
        int size = payload.length;
        byte[] header = concat(fourcc.getBytes(StandardCharsets.US_ASCII),
                new byte[]{(byte) size, (byte) (size >> 8), (byte) (size >> 16), (byte) (size >> 24)});
        return (size & 1) == 1 ? concat(header, payload, new byte[1]) : concat(header, payload);
    }

    private static byte[] riff(byte[]... chunks) {
        byte[] body = concat(chunks);
        int size = body.length + 4;
        return concat("RIFF".getBytes(StandardCharsets.US_ASCII),
                new byte[]{(byte) size, (byte) (size >> 8), (byte) (size >> 16), (byte) (size >> 24)},
                "WEBP".getBytes(StandardCharsets.US_ASCII), body);
    }

    private static byte[] concat(byte[]... parts) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        for (byte[] p : parts) {
            out.writeBytes(p);
        }
        return out.toByteArray();
    }
}
