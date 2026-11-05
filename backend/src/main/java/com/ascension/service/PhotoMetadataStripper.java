package com.ascension.service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Removes EXIF and XMP (camera, date and often GPS) from a JPEG or WebP without re-encoding it.
 * The phone already drops them, but an old app or a direct API call might not. A file whose
 * structure cannot be followed is returned unchanged; the type check has already accepted it.
 */
final class PhotoMetadataStripper {

    private PhotoMetadataStripper() {
    }

    static byte[] strip(byte[] bytes, String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> jpeg(bytes);
            case "image/webp" -> webp(bytes);
            default -> bytes;
        };
    }

    /** Drops every APP1 segment (where EXIF and XMP live) before the image data starts. */
    private static byte[] jpeg(byte[] b) {
        ByteArrayOutputStream out = new ByteArrayOutputStream(b.length);
        out.write(b, 0, 2);
        int i = 2;
        boolean removed = false;
        while (i + 1 < b.length) {
            if ((b[i] & 0xFF) != 0xFF) {
                return b;
            }
            int marker = b[i + 1] & 0xFF;
            if (marker == 0xFF) {
                i++;
                continue;
            }
            if (marker == 0xDA || marker == 0xD9) {
                out.write(b, i, b.length - i);
                return removed ? out.toByteArray() : b;
            }
            if (marker == 0x01 || (marker >= 0xD0 && marker <= 0xD7)) {
                out.write(b, i, 2);
                i += 2;
                continue;
            }
            if (i + 3 >= b.length) {
                return b;
            }
            int length = ((b[i + 2] & 0xFF) << 8) | (b[i + 3] & 0xFF);
            if (length < 2 || i + 2 + length > b.length) {
                return b;
            }
            if (marker == 0xE1) {
                removed = true;
            } else {
                out.write(b, i, 2 + length);
            }
            i += 2 + length;
        }
        return b;
    }

    /** Drops the EXIF and XMP chunks and clears their flags in the VP8X header. */
    private static byte[] webp(byte[] b) {
        ByteArrayOutputStream out = new ByteArrayOutputStream(b.length);
        out.write(b, 0, 12);
        int i = 12;
        boolean removed = false;
        int vp8xFlagsAt = -1;
        while (i + 8 <= b.length) {
            String fourcc = new String(b, i, 4, StandardCharsets.US_ASCII);
            long size = (b[i + 4] & 0xFFL) | (b[i + 5] & 0xFFL) << 8 | (b[i + 6] & 0xFFL) << 16 | (b[i + 7] & 0xFFL) << 24;
            long total = 8 + size + (size & 1);
            if (i + 8 + size > b.length) {
                return b;
            }
            int span = (int) Math.min(total, b.length - i);
            if (fourcc.equals("EXIF") || fourcc.equals("XMP ")) {
                removed = true;
            } else {
                if (fourcc.equals("VP8X") && size > 0) {
                    vp8xFlagsAt = out.size() + 8;
                }
                out.write(b, i, span);
            }
            i += span;
        }
        if (!removed) {
            return b;
        }
        byte[] result = out.toByteArray();
        if (vp8xFlagsAt >= 0) {
            result[vp8xFlagsAt] &= (byte) ~0x0C;
        }
        int riffSize = result.length - 8;
        result[4] = (byte) riffSize;
        result[5] = (byte) (riffSize >> 8);
        result[6] = (byte) (riffSize >> 16);
        result[7] = (byte) (riffSize >> 24);
        return result;
    }
}
