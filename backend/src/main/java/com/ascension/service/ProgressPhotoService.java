package com.ascension.service;

import com.ascension.util.Emails;
import com.ascension.dto.ProgressPhotoDtos.ExportedPhoto;
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
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Progress photos. The phone already shrinks and re-encodes each photo (which also drops EXIF);
 * the server checks it really is a small JPEG or WebP and strips any EXIF/XMP left before storing it privately.
 */
@Slf4j
@Service
public class ProgressPhotoService {

    static final int MAX_BYTES = 2 * 1024 * 1024;
    static final int MAX_PHOTOS = 300;
    private static final Duration URL_TTL = Duration.ofMinutes(15);
    private static final LocalDate OLDEST = LocalDate.of(2000, 1, 1);

    static final int RETRY_BATCH = 500;

    private final JdbcTemplate jdbcTemplate;
    private final PhotoStorage storage;
    private final TransactionTemplate tx;
    private final TransactionTemplate newTx;
    private final UserIdLookup userIdLookup;

    public ProgressPhotoService(JdbcTemplate jdbcTemplate, PhotoStorage storage,
                                PlatformTransactionManager transactionManager, UserIdLookup userIdLookup) {
        this.jdbcTemplate = jdbcTemplate;
        this.storage = storage;
        this.userIdLookup = userIdLookup;
        this.tx = new TransactionTemplate(transactionManager);
        this.newTx = new TransactionTemplate(transactionManager);
        this.newTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
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
                rs.getTimestamp("created_at").toInstant()), Emails.normalize(email)));
    }

    /** Every stored photo's details for the data export, oldest first; works with storage off too. */
    public List<ExportedPhoto> exportFor(String email) {
        return jdbcTemplate.query("""
                SELECT p.id, p.pose, p.taken_on, p.content_type, p.size_bytes, p.created_at
                FROM progress_photos p JOIN users u ON u.id = p.user_id
                WHERE u.email = ?
                ORDER BY p.taken_on, p.created_at
                """, (rs, n) -> new ExportedPhoto(
                rs.getObject("id", UUID.class),
                Pose.valueOf(rs.getString("pose")),
                rs.getObject("taken_on", LocalDate.class),
                rs.getString("content_type"),
                rs.getInt("size_bytes"),
                rs.getTimestamp("created_at").toInstant()), Emails.normalize(email));
    }

    /**
     * The object goes up before the row and outside any transaction, so no lock is held during the
     * network call. If the row then cannot be saved, the object is removed again.
     */
    public Photo upload(String email, Pose pose, LocalDate takenOn, byte[] original, LocalDate today) {
        if (!storage.enabled()) {
            throw new ExternalApiException("R2", HttpStatus.SERVICE_UNAVAILABLE, "Las fotos no están disponibles ahora mismo.");
        }
        if (pose == null || takenOn == null) {
            throw new InvalidInputException("Indica la pose y la fecha de la foto.");
        }
        if (takenOn.isAfter(today) || takenOn.isBefore(OLDEST)) {
            throw new InvalidInputException("La fecha de la foto no es válida.");
        }
        if (original == null || original.length == 0) {
            throw new InvalidInputException("La foto está vacía.");
        }
        if (original.length > MAX_BYTES) {
            throw new InvalidInputException("La foto pesa demasiado (máximo 2 MB).");
        }
        String contentType = contentType(original);
        if (contentType == null) {
            throw new InvalidInputException("Formato de foto no admitido. Usa JPEG o WebP.");
        }
        byte[] bytes = PhotoMetadataStripper.strip(original, contentType);
        UUID userId = userIdLookup.require(email);
        // Checked first without a lock, so a full gallery never uploads anything.
        checkPhotoCap(userId);
        UUID id = UUID.randomUUID();
        String key = "progress/" + userId + "/" + id + (contentType.equals("image/webp") ? ".webp" : ".jpg");
        storage.put(key, bytes, contentType);
        Timestamp createdAt;
        try {
            createdAt = tx.execute(status -> {
                // Locking the user row serialises the inserts, so two at once cannot both pass the cap.
                jdbcTemplate.queryForObject("SELECT id FROM users WHERE id = ? FOR UPDATE", UUID.class, userId);
                checkPhotoCap(userId);
                return jdbcTemplate.queryForObject("""
                        INSERT INTO progress_photos (id, user_id, pose, taken_on, object_key, content_type, size_bytes)
                        VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING created_at
                        """, Timestamp.class, id, userId, pose.name(), takenOn, key, contentType, bytes.length);
            });
        } catch (RuntimeException e) {
            removeObjects(List.of(key));
            throw e;
        }
        return new Photo(id, pose, takenOn, storage.signedUrl(key, URL_TTL), bytes.length, createdAt.toInstant());
    }

    private void checkPhotoCap(UUID userId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM progress_photos WHERE user_id = ?", Integer.class, userId);
        if (count != null && count >= MAX_PHOTOS) {
            throw new UserDataQuotaExceededException(
                    "Has llegado al máximo de " + MAX_PHOTOS + " fotos. Borra alguna antigua.");
        }
    }

    @Transactional
    public void delete(String email, UUID photoId) {
        List<String> keys = jdbcTemplate.queryForList("""
                DELETE FROM progress_photos
                WHERE id = ? AND user_id = (SELECT id FROM users WHERE email = ?)
                RETURNING object_key
                """, String.class, photoId, Emails.normalize(email));
        if (keys.isEmpty()) {
            throw new EntityNotFoundException("Foto no encontrada");
        }
        deleteAfterCommit(keys);
    }

    /** Called while the account is being deleted; the rows go with the user through the cascade. */
    public void deleteAllObjectsFor(String email) {
        List<String> keys = jdbcTemplate.queryForList("""
                SELECT p.object_key FROM progress_photos p JOIN users u ON u.id = p.user_id WHERE u.email = ?
                """, String.class, Emails.normalize(email));
        if (!keys.isEmpty()) {
            deleteAfterCommit(keys);
        }
    }

    /** Objects are removed only once the rows are gone for good, so a rollback never leaves broken rows. */
    private void deleteAfterCommit(List<String> keys) {
        Runnable remove = () -> removeObjects(keys);
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

    /** Removes the objects now; anything R2 refuses is queued and retried later instead of lost. */
    private void removeObjects(List<String> keys) {
        try {
            storage.delete(keys);
        } catch (RuntimeException e) {
            log.warn("Could not delete {} progress photo objects, queued for retry", keys.size(), e);
            try {
                // Its own transaction: this can run after the caller's has already committed.
                newTx.executeWithoutResult(status -> jdbcTemplate.batchUpdate("""
                        INSERT INTO photo_object_deletions (object_key) VALUES (?)
                        ON CONFLICT (object_key) DO NOTHING
                        """, keys, keys.size(), (ps, key) -> ps.setString(1, key)));
            } catch (RuntimeException queueError) {
                log.error("Could not queue {} progress photo objects for deletion", keys.size(), queueError);
            }
        }
    }

    /** Retries queued deletions, waiting a little longer after each failure (up to a day). */
    @Scheduled(fixedDelayString = "PT15M", initialDelayString = "PT2M")
    public void retryPendingDeletions() {
        if (!storage.enabled()) {
            return;
        }
        List<String> keys = jdbcTemplate.queryForList("""
                SELECT object_key FROM photo_object_deletions
                WHERE next_try_at <= NOW() ORDER BY next_try_at LIMIT ?
                """, String.class, RETRY_BATCH);
        if (keys.isEmpty()) {
            return;
        }
        try {
            storage.delete(keys);
            jdbcTemplate.batchUpdate("DELETE FROM photo_object_deletions WHERE object_key = ?",
                    keys, keys.size(), (ps, key) -> ps.setString(1, key));
        } catch (RuntimeException e) {
            log.warn("Retry of {} progress photo deletions failed", keys.size(), e);
            jdbcTemplate.batchUpdate("""
                    UPDATE photo_object_deletions
                    SET attempts = attempts + 1,
                        next_try_at = NOW() + LEAST(attempts + 1, 24) * INTERVAL '1 hour'
                    WHERE object_key = ?
                    """, keys, keys.size(), (ps, key) -> ps.setString(1, key));
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

}
