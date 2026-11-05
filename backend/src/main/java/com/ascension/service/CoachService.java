package com.ascension.service;

import com.ascension.dto.CoachDtos.AccessExport;
import com.ascension.dto.CoachDtos.AccessLogEntry;
import com.ascension.dto.CoachDtos.AssignmentExport;
import com.ascension.dto.CoachDtos.CommentExport;
import com.ascension.dto.CoachDtos.CoachClient;
import com.ascension.dto.CoachDtos.CoachingExport;
import com.ascension.dto.CoachDtos.CreatedInvitation;
import com.ascension.dto.CoachDtos.InvitationExport;
import com.ascension.dto.CoachDtos.InvitationPreview;
import com.ascension.dto.CoachDtos.LinkExport;
import com.ascension.dto.CoachDtos.MyCoach;
import com.ascension.dto.CoachDtos.PendingInvitation;
import com.ascension.dto.CoachDtos.Permissions;
import com.ascension.dto.CoachDtos.Person;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.exception.InvalidInputException;
import com.ascension.model.RefreshToken;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Coach-client links: becoming a coach, inviting clients, the client's consent, and either side
 * ending the link. Links reference users by id so they follow an email change, and cascade away
 * with either account. Reading a client's data goes through {@link CoachAccessPolicy}, not here.
 */
@Service
public class CoachService {

    static final Duration INVITATION_TTL = Duration.ofDays(7);
    static final int MAX_OPEN_INVITATIONS = 20;
    static final int MAX_ACTIVE_CLIENTS = 200;
    private static final int ACCESS_LOG_DAYS = 90;
    private static final int ACCESS_LOG_LIMIT = 500;
    // 32 random bytes as unpadded base64url.
    private static final Pattern TOKEN_FORMAT = Pattern.compile("[A-Za-z0-9_-]{43}");

    private final JdbcTemplate jdbcTemplate;
    private final NutritionPlanService nutritionPlanService;
    private final CheckinService checkinService;
    private final SecureRandom random = new SecureRandom();

    public CoachService(JdbcTemplate jdbcTemplate, NutritionPlanService nutritionPlanService,
                        CheckinService checkinService) {
        this.jdbcTemplate = jdbcTemplate;
        this.nutritionPlanService = nutritionPlanService;
        this.checkinService = checkinService;
    }

    // ---- Coach side ----

    @Transactional
    public void activateCoach(String coachEmail) {
        jdbcTemplate.update("""
                INSERT INTO coach_profiles (user_id)
                SELECT id FROM users WHERE email = ?
                ON CONFLICT (user_id) DO NOTHING
                """, normalize(coachEmail));
    }

    public boolean isCoach(String email) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM coach_profiles cp JOIN users u ON u.id = cp.user_id
                WHERE u.email = ?
                """, Integer.class, normalize(email));
        return count != null && count > 0;
    }

    @Transactional
    public CreatedInvitation createInvitation(String coachEmail) {
        UUID coachId = requireCoachId(coachEmail);
        // Serialises invitation creation per coach so the limits below hold under concurrency.
        jdbcTemplate.queryForObject("SELECT user_id FROM coach_profiles WHERE user_id = ? FOR UPDATE",
                UUID.class, coachId);
        Integer open = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM coach_invitations
                WHERE coach_user_id = ? AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > NOW()
                """, Integer.class, coachId);
        if (open != null && open >= MAX_OPEN_INVITATIONS) {
            throw new InvalidInputException("Tienes demasiadas invitaciones pendientes. Revoca alguna antes de crear otra.");
        }
        if (activeClientCount(coachId) >= MAX_ACTIVE_CLIENTS) {
            throw new InvalidInputException("Has alcanzado el máximo de alumnos activos.");
        }
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant expiresAt = Instant.now().plus(INVITATION_TTL);
        UUID id = jdbcTemplate.queryForObject("""
                INSERT INTO coach_invitations (coach_user_id, token_hash, expires_at)
                VALUES (?, ?, ?) RETURNING id
                """, UUID.class, coachId, RefreshToken.hashToken(token), Timestamp.from(expiresAt));
        return new CreatedInvitation(id, token, expiresAt);
    }

    public List<PendingInvitation> listInvitations(String coachEmail) {
        UUID coachId = requireCoachId(coachEmail);
        return jdbcTemplate.query("""
                SELECT id, created_at, expires_at FROM coach_invitations
                WHERE coach_user_id = ? AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > NOW()
                ORDER BY created_at DESC
                """,
                (rs, n) -> new PendingInvitation(rs.getObject("id", UUID.class),
                        instant(rs, "created_at"), instant(rs, "expires_at")),
                coachId);
    }

    @Transactional
    public void revokeInvitation(String coachEmail, UUID invitationId) {
        UUID coachId = requireCoachId(coachEmail);
        int updated = jdbcTemplate.update("""
                UPDATE coach_invitations SET revoked_at = NOW()
                WHERE id = ? AND coach_user_id = ? AND accepted_at IS NULL AND revoked_at IS NULL
                """, invitationId, coachId);
        if (updated == 0) {
            throw new EntityNotFoundException("Invitación no encontrada");
        }
    }

    public List<CoachClient> listClients(String coachEmail) {
        UUID coachId = requireCoachId(coachEmail);
        return jdbcTemplate.query("""
                SELECT cc.id, cc.created_at, cc.can_view_training, cc.can_view_nutrition, cc.can_view_body, cc.can_edit_training, cc.can_edit_nutrition,
                       u.name, u.email, u.picture
                FROM coach_clients cc JOIN users u ON u.id = cc.client_user_id
                WHERE cc.coach_user_id = ? AND cc.status = 'ACTIVE'
                ORDER BY LOWER(COALESCE(u.name, u.email))
                """,
                (rs, n) -> new CoachClient(rs.getObject("id", UUID.class), person(rs),
                        permissions(rs), instant(rs, "created_at")),
                coachId);
    }

    @Transactional
    public void endLinkAsCoach(String coachEmail, UUID linkId) {
        int updated = jdbcTemplate.update("""
                UPDATE coach_clients SET status = 'ENDED', ended_at = NOW()
                WHERE id = ? AND status = 'ACTIVE'
                  AND coach_user_id = (SELECT id FROM users WHERE email = ?)
                """, linkId, normalize(coachEmail));
        if (updated == 0) {
            throw new EntityNotFoundException("Alumno no encontrado");
        }
    }

    // ---- Client side ----

    public InvitationPreview previewInvitation(String clientEmail, String token) {
        OpenInvitation invitation = findOpenInvitation(token, false);
        UUID clientId = requireUserId(clientEmail);
        if (invitation.coachUserId().equals(clientId)) {
            throw new InvalidInputException("No puedes aceptar tu propia invitación.");
        }
        Person coach = jdbcTemplate.queryForObject(
                "SELECT name, email, picture FROM users WHERE id = ?",
                (rs, n) -> person(rs), invitation.coachUserId());
        return new InvitationPreview(coach, invitation.expiresAt(),
                activeLinkExists(invitation.coachUserId(), clientId));
    }

    @Transactional
    public MyCoach acceptInvitation(String clientEmail, String token, Permissions permissions) {
        if (permissions == null || !permissions.any()) {
            throw new InvalidInputException("Elige al menos un área que tu entrenador pueda ver.");
        }
        OpenInvitation invitation = findOpenInvitation(token, true);
        UUID clientId = requireUserId(clientEmail);
        if (invitation.coachUserId().equals(clientId)) {
            throw new InvalidInputException("No puedes aceptar tu propia invitación.");
        }
        if (activeLinkExists(invitation.coachUserId(), clientId)) {
            throw new InvalidInputException("Ya estás vinculado con este entrenador.");
        }
        if (activeClientCount(invitation.coachUserId()) >= MAX_ACTIVE_CLIENTS) {
            throw new InvalidInputException("Este entrenador no admite más alumnos ahora mismo.");
        }
        UUID linkId;
        try {
            linkId = jdbcTemplate.queryForObject("""
                    INSERT INTO coach_clients (coach_user_id, client_user_id, status,
                                               can_view_training, can_view_nutrition, can_view_body,
                                               can_edit_training, can_edit_nutrition)
                    VALUES (?, ?, 'ACTIVE', ?, ?, ?, ?, ?) RETURNING id
                    """, UUID.class, invitation.coachUserId(), clientId,
                    permissions.training(), permissions.nutrition(), permissions.body(), permissions.grantsEdit(),
                    permissions.grantsEditNutrition());
        } catch (DuplicateKeyException e) {
            throw new InvalidInputException("Ya estás vinculado con este entrenador.");
        }
        jdbcTemplate.update("UPDATE coach_invitations SET accepted_at = NOW(), accepted_by = ? WHERE id = ?",
                clientId, invitation.id());
        return listMyCoaches(clientEmail).stream()
                .filter(c -> c.linkId().equals(linkId))
                .findFirst()
                .orElseThrow();
    }

    public List<MyCoach> listMyCoaches(String clientEmail) {
        return jdbcTemplate.query("""
                SELECT cc.id, cc.created_at, cc.can_view_training, cc.can_view_nutrition, cc.can_view_body, cc.can_edit_training, cc.can_edit_nutrition,
                       co.name, co.email, co.picture
                FROM coach_clients cc
                JOIN users cu ON cu.id = cc.client_user_id
                JOIN users co ON co.id = cc.coach_user_id
                WHERE cu.email = ? AND cc.status = 'ACTIVE'
                ORDER BY cc.created_at
                """,
                (rs, n) -> new MyCoach(rs.getObject("id", UUID.class), person(rs),
                        permissions(rs), instant(rs, "created_at")),
                normalize(clientEmail));
    }

    @Transactional
    public void updatePermissions(String clientEmail, UUID linkId, Permissions permissions) {
        if (permissions == null || !permissions.any()) {
            throw new InvalidInputException("Deja al menos un área visible o termina la relación con el entrenador.");
        }
        int updated = jdbcTemplate.update("""
                UPDATE coach_clients
                SET can_view_training = ?, can_view_nutrition = ?, can_view_body = ?, can_edit_training = ?,
                    can_edit_nutrition = ?
                WHERE id = ? AND status = 'ACTIVE'
                  AND client_user_id = (SELECT id FROM users WHERE email = ?)
                """, permissions.training(), permissions.nutrition(), permissions.body(), permissions.grantsEdit(),
                permissions.grantsEditNutrition(), linkId, normalize(clientEmail));
        if (updated == 0) {
            throw new EntityNotFoundException("Entrenador no encontrado");
        }
    }

    @Transactional
    public void endLinkAsClient(String clientEmail, UUID linkId) {
        int updated = jdbcTemplate.update("""
                UPDATE coach_clients SET status = 'ENDED', ended_at = NOW()
                WHERE id = ? AND status = 'ACTIVE'
                  AND client_user_id = (SELECT id FROM users WHERE email = ?)
                """, linkId, normalize(clientEmail));
        if (updated == 0) {
            throw new EntityNotFoundException("Entrenador no encontrado");
        }
    }

    public List<AccessLogEntry> accessLog(String clientEmail) {
        return jdbcTemplate.query("""
                SELECT co.name, co.email, co.picture, l.action, l.access_date, l.last_at, l.hits
                FROM coach_access_log l
                JOIN users cu ON cu.id = l.client_user_id
                JOIN users co ON co.id = l.coach_user_id
                WHERE cu.email = ? AND l.access_date >= CURRENT_DATE - ?
                ORDER BY l.access_date DESC, l.last_at DESC
                LIMIT ?
                """,
                (rs, n) -> new AccessLogEntry(person(rs), rs.getString("action"),
                        rs.getObject("access_date", LocalDate.class), instant(rs, "last_at"), rs.getInt("hits")),
                normalize(clientEmail), ACCESS_LOG_DAYS, ACCESS_LOG_LIMIT);
    }

    // ---- GDPR export ----

    /** Everything coach mode keeps about this user, as coach and as client. Null when there is nothing. */
    @Transactional(readOnly = true)
    public CoachingExport exportFor(String email) {
        List<UUID> ids = jdbcTemplate.queryForList("SELECT id FROM users WHERE email = ?", UUID.class,
                normalize(email));
        if (ids.isEmpty()) {
            return null;
        }
        UUID userId = ids.get(0);
        List<Instant> coachSince = jdbcTemplate.query(
                "SELECT created_at FROM coach_profiles WHERE user_id = ?",
                (rs, n) -> instant(rs, "created_at"), userId);
        List<LinkExport> asClient = exportLinks("client_user_id", "coach_user_id", userId);
        List<LinkExport> asCoach = exportLinks("coach_user_id", "client_user_id", userId);
        List<InvitationExport> invitations = jdbcTemplate.query("""
                SELECT id, created_at, expires_at, accepted_at, revoked_at FROM coach_invitations
                WHERE coach_user_id = ? ORDER BY created_at
                """,
                (rs, n) -> new InvitationExport(rs.getObject("id", UUID.class), instant(rs, "created_at"),
                        instant(rs, "expires_at"), instant(rs, "accepted_at"), instant(rs, "revoked_at")),
                userId);
        List<AccessExport> accessesToMyData = exportAccesses("client_user_id", "coach_user_id", userId);
        List<AccessExport> myAccessesAsCoach = exportAccesses("coach_user_id", "client_user_id", userId);
        List<AssignmentExport> assignments = jdbcTemplate.query("""
                SELECT a.id, CASE WHEN a.client_user_id = ? THEN 'CLIENT' ELSE 'COACH' END AS role,
                       a.program_id, p.name AS program_name, a.start_date, a.status, a.created_at, a.ended_at,
                       u.name, u.email, u.picture
                FROM program_assignments a
                JOIN programs p ON p.id = a.program_id
                LEFT JOIN users u ON u.id = CASE WHEN a.client_user_id = ? THEN a.coach_user_id
                                                 ELSE a.client_user_id END
                WHERE a.client_user_id = ? OR a.coach_user_id = ?
                ORDER BY a.created_at
                """,
                (rs, n) -> new AssignmentExport(rs.getObject("id", UUID.class), rs.getString("role"),
                        rs.getString("email") == null ? null : person(rs), rs.getObject("program_id", UUID.class),
                        rs.getString("program_name"), rs.getObject("start_date", LocalDate.class),
                        rs.getString("status"), instant(rs, "created_at"), instant(rs, "ended_at")),
                userId, userId, userId, userId);
        List<CommentExport> comments = jdbcTemplate.query("""
                SELECT c.id, CASE WHEN c.coach_user_id = ? THEN 'COACH' ELSE 'CLIENT' END AS role,
                       c.workout_id, c.body, c.created_at, c.updated_at, u.name, u.email, u.picture
                FROM workout_comments c
                JOIN workouts w ON w.id = c.workout_id
                JOIN users u ON u.email = CASE WHEN c.coach_user_id = ? THEN w.user_email
                                               ELSE (SELECT email FROM users WHERE id = c.coach_user_id) END
                WHERE c.coach_user_id = ? OR w.user_email = (SELECT email FROM users WHERE id = ?)
                ORDER BY c.created_at
                """,
                (rs, n) -> new CommentExport(rs.getObject("id", UUID.class), rs.getString("role"), person(rs),
                        rs.getString("workout_id"), rs.getString("body"), instant(rs, "created_at"),
                        instant(rs, "updated_at")),
                userId, userId, userId, userId);
        var nutritionPlans = nutritionPlanService.exportFor(userId);
        var checkins = checkinService.exportFor(userId);
        if (coachSince.isEmpty() && asClient.isEmpty() && asCoach.isEmpty() && invitations.isEmpty()
                && accessesToMyData.isEmpty() && myAccessesAsCoach.isEmpty() && assignments.isEmpty()
                && comments.isEmpty() && nutritionPlans.isEmpty() && checkins.isEmpty()) {
            return null;
        }
        return new CoachingExport(coachSince.isEmpty() ? null : coachSince.get(0), asClient, asCoach,
                invitations, accessesToMyData, myAccessesAsCoach, assignments, comments, nutritionPlans, checkins);
    }

    // Column names come from the two callers above, never from input.
    private List<LinkExport> exportLinks(String selfColumn, String otherColumn, UUID userId) {
        return jdbcTemplate.query("""
                SELECT cc.id, cc.status, cc.created_at, cc.ended_at,
                       cc.can_view_training, cc.can_view_nutrition, cc.can_view_body, cc.can_edit_training, cc.can_edit_nutrition,
                       u.name, u.email, u.picture
                FROM coach_clients cc JOIN users u ON u.id = cc.%s
                WHERE cc.%s = ? ORDER BY cc.created_at
                """.formatted(otherColumn, selfColumn),
                (rs, n) -> new LinkExport(rs.getObject("id", UUID.class), person(rs), rs.getString("status"),
                        permissions(rs), instant(rs, "created_at"), instant(rs, "ended_at")),
                userId);
    }

    private List<AccessExport> exportAccesses(String selfColumn, String otherColumn, UUID userId) {
        return jdbcTemplate.query("""
                SELECT u.name, u.email, u.picture, l.action, l.access_date, l.first_at, l.last_at, l.hits
                FROM coach_access_log l JOIN users u ON u.id = l.%s
                WHERE l.%s = ? ORDER BY l.access_date, l.first_at
                """.formatted(otherColumn, selfColumn),
                (rs, n) -> new AccessExport(person(rs), rs.getString("action"),
                        rs.getObject("access_date", LocalDate.class), instant(rs, "first_at"),
                        instant(rs, "last_at"), rs.getInt("hits")),
                userId);
    }

    // ---- Helpers ----

    private record OpenInvitation(UUID id, UUID coachUserId, Instant expiresAt) {
    }

    /** Unknown, malformed, expired, revoked and used tokens all look the same: 404. */
    private OpenInvitation findOpenInvitation(String token, boolean lock) {
        if (token == null || !TOKEN_FORMAT.matcher(token).matches()) {
            throw new EntityNotFoundException("Invitación no válida o caducada");
        }
        List<OpenInvitation> found = jdbcTemplate.query("""
                SELECT i.id, i.coach_user_id, i.expires_at
                FROM coach_invitations i JOIN coach_profiles cp ON cp.user_id = i.coach_user_id
                WHERE i.token_hash = ? AND i.accepted_at IS NULL AND i.revoked_at IS NULL
                  AND i.expires_at > NOW()
                """ + (lock ? " FOR UPDATE OF i" : ""),
                (rs, n) -> new OpenInvitation(rs.getObject("id", UUID.class),
                        rs.getObject("coach_user_id", UUID.class), instant(rs, "expires_at")),
                RefreshToken.hashToken(token));
        if (found.isEmpty()) {
            throw new EntityNotFoundException("Invitación no válida o caducada");
        }
        return found.get(0);
    }

    UUID requireCoachId(String coachEmail) {
        List<UUID> ids = jdbcTemplate.queryForList("""
                SELECT cp.user_id FROM coach_profiles cp JOIN users u ON u.id = cp.user_id
                WHERE u.email = ?
                """, UUID.class, normalize(coachEmail));
        if (ids.isEmpty()) {
            throw new SecurityException("User is not a coach");
        }
        return ids.get(0);
    }

    private UUID requireUserId(String email) {
        List<UUID> ids = jdbcTemplate.queryForList("SELECT id FROM users WHERE email = ?",
                UUID.class, normalize(email));
        if (ids.isEmpty()) {
            throw new EntityNotFoundException("Usuario no encontrado");
        }
        return ids.get(0);
    }

    private boolean activeLinkExists(UUID coachId, UUID clientId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM coach_clients
                WHERE coach_user_id = ? AND client_user_id = ? AND status = 'ACTIVE'
                """, Integer.class, coachId, clientId);
        return count != null && count > 0;
    }

    private int activeClientCount(UUID coachId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM coach_clients WHERE coach_user_id = ? AND status = 'ACTIVE'",
                Integer.class, coachId);
        return count == null ? 0 : count;
    }

    private static String normalize(String email) {
        if (email == null || email.isBlank()) {
            throw new EntityNotFoundException("Usuario no encontrado");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static Person person(ResultSet rs) throws SQLException {
        return new Person(rs.getString("name"), rs.getString("email"), rs.getString("picture"));
    }

    private static Permissions permissions(ResultSet rs) throws SQLException {
        return new Permissions(rs.getBoolean("can_view_training"), rs.getBoolean("can_view_nutrition"),
                rs.getBoolean("can_view_body"), rs.getBoolean("can_edit_training"),
                rs.getBoolean("can_edit_nutrition"));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        Timestamp ts = rs.getTimestamp(column);
        return ts == null ? null : ts.toInstant();
    }
}
