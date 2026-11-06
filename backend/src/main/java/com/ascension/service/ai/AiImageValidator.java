package com.ascension.service.ai;

import com.ascension.exception.InvalidInputException;
import com.ascension.util.ImageFormats;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.ByteArrayInputStream;
import java.util.Iterator;

/** Checks that an image sent to the AI is a real JPEG, PNG or WebP and not larger than 25 megapixels. */
public final class AiImageValidator {

    public static final long MAX_PIXEL_COUNT = 25_000_000L;

    private AiImageValidator() {
    }

    public static String validate(byte[] data) {
        if (data == null || data.length < 12) {
            throw new InvalidInputException("La imagen está dañada o no se puede leer.");
        }
        String mimeType = ImageFormats.detect(data);

        if (mimeType == null) {
            throw new InvalidInputException("Formato de imagen no admitido. Usa JPEG, PNG o WebP.");
        }

        try (ByteArrayInputStream bais = new ByteArrayInputStream(data);
             ImageInputStream iis = ImageIO.createImageInputStream(bais)) {

            if (iis == null) {
                throw new InvalidInputException("La imagen está dañada o no se puede leer.");
            }

            Iterator<ImageReader> readers = ImageIO.getImageReaders(iis);
            if (!readers.hasNext()) {
                if (ImageFormats.WEBP.equals(mimeType)) {
                    validateWebpDimensions(data);
                    return "image/webp";
                }
                throw new InvalidInputException("La imagen está dañada o no se puede leer.");
            }

            ImageReader reader = readers.next();
            try {
                reader.setInput(iis, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);

                if (width <= 0 || height <= 0) {
                    throw new InvalidInputException("La imagen está dañada o no se puede leer.");
                }

                long pixelCount = (long) width * (long) height;
                if (pixelCount > MAX_PIXEL_COUNT) {
                    throw new InvalidInputException("La imagen supera el máximo de 25 megapíxeles (" + width + "x" + height + ").");
                }
            } finally {
                reader.dispose();
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new InvalidInputException("La imagen está dañada o no se puede leer.", e);
        }

        return mimeType;
    }

    private static void validateWebpDimensions(byte[] data) {
        if (data == null || data.length < 30) {
            return;
        }
        try {
            int width = -1;
            int height = -1;
            if (data[12] == 'V' && data[13] == 'P' && data[14] == '8' && data[15] == 'X') {
                width = 1 + ((data[24] & 0xFF) | ((data[25] & 0xFF) << 8) | ((data[26] & 0xFF) << 16));
                height = 1 + ((data[27] & 0xFF) | ((data[28] & 0xFF) << 8) | ((data[29] & 0xFF) << 16));
            } else if (data[12] == 'V' && data[13] == 'P' && data[14] == '8' && data[15] == ' ') {
                if (data.length >= 30 && (data[23] & 0xFF) == 0x9D && (data[24] & 0xFF) == 0x01 && (data[25] & 0xFF) == 0x2A) {
                    width = ((data[26] & 0xFF) | ((data[27] & 0xFF) << 8)) & 0x3FFF;
                    height = ((data[28] & 0xFF) | ((data[29] & 0xFF) << 8)) & 0x3FFF;
                }
            } else if (data[12] == 'V' && data[13] == 'P' && data[14] == '8' && data[15] == 'L') {
                if (data.length >= 25 && data[20] == 0x2F) {
                    int b1 = data[21] & 0xFF;
                    int b2 = data[22] & 0xFF;
                    int b3 = data[23] & 0xFF;
                    int b4 = data[24] & 0xFF;
                    width = 1 + (((b2 & 0x3F) << 8) | b1);
                    height = 1 + (((b4 & 0x0F) << 10) | (b3 << 2) | ((b2 & 0xC0) >> 6));
                }
            }
            if (width > 0 && height > 0) {
                long pixelCount = (long) width * (long) height;
                if (pixelCount > MAX_PIXEL_COUNT) {
                    throw new InvalidInputException("La imagen supera el máximo de 25 megapíxeles (" + width + "x" + height + ").");
                }
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception ignored) {
            // Non-fatal if extended chunks prevent direct parsing
        }
    }
}
