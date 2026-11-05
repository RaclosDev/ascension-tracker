package com.ascension.service;

import com.ascension.config.AdminProperties;
import com.ascension.dto.ContactDtos.AdminContactRequest;
import com.ascension.dto.ContactDtos.ContactRequestExport;
import com.ascension.dto.ContactDtos.NewContactRequest;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.exception.InvalidInputException;
import com.ascension.util.PiiMasker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/** Users asking about plans; the admins get a push and read them in the back office. */
@Slf4j
@Service
public class ContactRequestService {

    /** Enough to follow up on a conversation, not enough to flood the admins. */
    static final int MAX_PER_DAY = 3;

    private final JdbcTemplate jdbcTemplate;
    private final AdminProperties adminProperties;
    private final PushNotificationService pushNotificationService;

    public ContactRequestService(JdbcTemplate jdbcTemplate, AdminProperties adminProperties,
                                 PushNotificationService pushNotificationService) {
        this.jdbcTemplate = jdbcTemplate;
        this.adminProperties = adminProperties;
        this.pushNotificationService = pushNotificationService;
    }

    public void create(String userEmail, NewContactRequest request) {
        UUID userId = jdbcTemplate.query("SELECT id FROM users WHERE email = ?",
                rs -> rs.next() ? rs.getObject(1, UUID.class) : null, normalize(userEmail));
        if (userId == null) {
            throw new EntityNotFoundException("Usuario no encontrado");
        }
        Integer recent = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM contact_requests
                WHERE user_id = ? AND created_at > NOW() - INTERVAL '1 day'
                """, Integer.class, userId);
        if (recent != null && recent >= MAX_PER_DAY) {
            throw new InvalidInputException("Ya nos has escrito varias veces hoy. Te responderemos pronto.");
        }
        jdbcTemplate.update("""
                INSERT INTO contact_requests (user_id, topic, message, desired_clients) VALUES (?, ?, ?, ?)
                """, userId, request.topic(), request.message().trim(), request.desiredClients());
        log.info("Contact request ({}) from {}", request.topic(), PiiMasker.maskEmail(userEmail));
        for (String admin : adminProperties.getEmails()) {
            if (admin != null && !admin.isBlank()) {
                pushNotificationService.sendAsync(normalize(admin), "Nueva solicitud de contacto",
                        "Alguien pregunta por los planes de entrenador.", "contact-request", "/admin/planes");
            }
        }
    }

    /** Open requests first, newest first within each group. */
    public List<AdminContactRequest> listForAdmin() {
        return jdbcTemplate.query("""
                SELECT r.id, u.name, u.email, r.topic, r.message, r.desired_clients, r.created_at, r.handled_at
                FROM contact_requests r JOIN users u ON u.id = r.user_id
                ORDER BY (r.handled_at IS NULL) DESC, r.created_at DESC
                LIMIT 200
                """, (rs, n) -> new AdminContactRequest(rs.getObject("id", UUID.class), rs.getString("name"),
                rs.getString("email"), rs.getString("topic"), rs.getString("message"),
                (Integer) rs.getObject("desired_clients"), instant(rs, "created_at"), instant(rs, "handled_at")));
    }

    public void setHandled(UUID id, boolean handled) {
        int updated = jdbcTemplate.update(
                "UPDATE contact_requests SET handled_at = " + (handled ? "COALESCE(handled_at, NOW())" : "NULL")
                        + " WHERE id = ?", id);
        if (updated == 0) {
            throw new EntityNotFoundException("Solicitud no encontrada");
        }
    }

    public List<ContactRequestExport> exportFor(String userEmail) {
        return jdbcTemplate.query("""
                SELECT r.topic, r.message, r.desired_clients, r.created_at, r.handled_at
                FROM contact_requests r JOIN users u ON u.id = r.user_id
                WHERE u.email = ? ORDER BY r.created_at
                """, (rs, n) -> new ContactRequestExport(rs.getString("topic"), rs.getString("message"),
                (Integer) rs.getObject("desired_clients"), instant(rs, "created_at"), instant(rs, "handled_at")),
                normalize(userEmail));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        Timestamp ts = rs.getTimestamp(column);
        return ts == null ? null : ts.toInstant();
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
