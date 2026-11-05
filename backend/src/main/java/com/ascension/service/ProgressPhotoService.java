package com.ascension.service;

import com.ascension.dto.ProgressPhotoDtos.Photo;
import com.ascension.dto.ProgressPhotoDtos.PhotoList;
import com.ascension.dto.ProgressPhotoDtos.Pose;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.exception.ExternalApiException;
import com.ascension.exception.InvalidInputException;
import com.ascension.exception.UserDataQuotaExceededException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Progress photos. The phone already shrinks and re-encodes each photo (which also drops EXIF),
 * so the server only checks it really is a small JPEG or WebP before storing it privately.
 */
@Slf4j
@Service
public class ProgressPhotoService {

    static final int MAX_BYTES = 2 * 1024 * 1024;
    static final int MAX_PHOTOS = 300;
    private static final Duration URL_TTL = Duration.ofMinutes(15);
    private static final LocalDate OLDEST = LocalDate.of(2000, 1, 1);

    private final JdbcTemplate jdbcTemplate;
    private final PhotoStorage storage;

    public ProgressPhotoService(JdbcTemplate jdbcTemplate, PhotoStorage storage) {
        this.jdbcTemplate = jdbcTemplate;
        this.storage = storage;
    }

    public PhotoList list(String email) {
        if (!storage.enabled()) {
            return new PhotoList(false, List.of());
        }
        return new PhotoList(true, jdbcTemplate.query("""
                SELECT p.id, p.pose, p.taken_on, p.object_key, p.size_bytes, p.created_at
                FROM progress_photos p JOIN users u ON u.id = p.user_id
                WHERE u.email = ?
                ORDER BY p.taken_on DESC, p.created_at DESC
                """, (rs, n) -> new Photo(
                rs.getObject("id", UUID.class),
                Pose.valueOf(rs.getString("pose")),
                rs.getObject("taken_on", LocalDate.class),
                storage.signedUrl(rs.getString("object_key"), URL_TTL),
                rs.getInt("size_bytes"),
                rs.getTimestamp("created_at").toInstant()), normalize(email)));
    }

    @Transactional
    public Photo upload(String email, Pose pose, LocalDate takenOn, byte[] bytes, LocalDate today) {
        if (!storage.enabled()) {
            throw new ExternalApiException("R2", HttpStatus.SERVICE_UNAVAILABLE, "Las fotos no están disponibles ahora mismo.");
        }
        if (pose == null || takenOn == null) {
            throw new InvalidInputException("Indica la pose y la fecha de la foto.");
        }
        if (takenOn.isAfter(today) || takenOn.isBefore(OLDEST)) {
            throw new InvalidInputException("La fecha de la foto no es válida.");
        }
        if (bytes == null || bytes.length == 0) {
            throw new InvalidInputException("La foto está vacía.");
        }
        if (bytes.length > MAX_BYTES) {
            throw new InvalidInputException("La foto pesa demasiado (máximo 2 MB).");
        }
        String contentType = contentType(bytes);
        if (contentType == null) {
            throw new InvalidInputException("Formato de foto no admitido. Usa JPEG o WebP.");
        }
        // Locking the user row serialises uploads, so two at once cannot both slip past the cap.
        UUID userId = jdbcTemplate.queryForObject("SELECT id FROM users WHERE email = ? FOR UPDATE",
                UUID.class, normalize(email));
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM progress_photos WHERE user_id = ?", Integer.class, userId);
        if (count != null && count >= MAX_PHOTOS) {
            throw new UserDataQuotaExceededException(
                    "Has llegado al máximo de " + MAX_PHOTOS + " fotos. Borra alguna antigua.");
        }
        UUID id = UUID.randomUUID();
        String key = "progress/" + userId + "/" + id + (contentType.equals("image/webp") ? ".webp" : ".jpg");
        Timestamp createdAt = jdbcTemplate.queryForObject("""
                INSERT INTO progress_photos (id, user_id, pose, taken_on, object_key, content_type, size_bytes)
                VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING created_at
                """, Timestamp.class, id, userId, pose.name(), takenOn, key, contentType, bytes.length);
        // Stored last: if the upload fails the row is rolled back with it.
        storage.put(key, bytes, contentType);
        return new Photo(id, pose, takenOn, storage.signedUrl(key, URL_TTL), bytes.length, createdAt.toInstant());
    }

    @Transactional
    public void delete(String email, UUID photoId) {
        List<String> keys = jdbcTemplate.queryForList("""
                DELETE FROM progress_photos
                WHERE id = ? AND user_id = (SELECT id FROM users WHERE email = ?)
                RETURNING object_key
                """, String.class, photoId, normalize(email));
        if (keys.isEmpty()) {
            throw new EntityNotFoundException("Foto no encontrada");
        }
        deleteAfterCommit(keys);
    }

    /** Called while the account is being deleted; the rows go with the user through the cascade. */
    public void deleteAllObjectsFor(String email) {
        List<String> keys = jdbcTemplate.queryForList("""
                SELECT p.object_key FROM progress_photos p JOIN users u ON u.id = p.user_id WHERE u.email = ?
                """, String.class, normalize(email));
        if (!keys.isEmpty()) {
            deleteAfterCommit(keys);
        }
    }

    /** Objects are removed only once the rows are gone for good, so a rollback never leaves broken rows. */
    private void deleteAfterCommit(List<String> keys) {
        Runnable remove = () -> {
            try {
                storage.delete(keys);
            } catch (RuntimeException e) {
                log.error("Could not delete {} progress photo objects", keys.size(), e);
            }
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    remove.run();
                }
            });
        } else {
            remove.run();
        }
    }

    /** Checks the file's first bytes, never its name or declared type. */
    static String contentType(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (b.length >= 12
                && Arrays.equals(Arrays.copyOfRange(b, 0, 4), "RIFF".getBytes(StandardCharsets.US_ASCII))
                && Arrays.equals(Arrays.copyOfRange(b, 8, 12), "WEBP".getBytes(StandardCharsets.US_ASCII))) {
            return "image/webp";
        }
        return null;
    }

    public static byte[] read(MultipartFile file) {
        if (file == null) {
            return null;
        }
        if (file.getSize() > MAX_BYTES) {
            throw new InvalidInputException("La foto pesa demasiado (máximo 2 MB).");
        }
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new InvalidInputException("No se pudo leer la foto.");
        }
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
