package com.ascension.service;

import com.ascension.util.Emails;
import com.ascension.dto.CheckinDtos.Answer;
import com.ascension.dto.CheckinDtos.Checkin;
import com.ascension.dto.CheckinDtos.CheckinExport;
import com.ascension.dto.CheckinDtos.CheckinRequest;
import com.ascension.dto.CheckinDtos.ClientCheckin;
import com.ascension.dto.CheckinDtos.Template;
import com.ascension.dto.CheckinDtos.TemplateRequest;
import com.ascension.dto.CoachDtos.Person;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.exception.InvalidInputException;
import com.ascension.service.CoachAccessPolicy.ClientAccess;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

import java.sql.Timestamp;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Weekly check-ins. Each coach has one set of questions; the client answers them once a week per
 * coach and can change the answers until the coach replies. The questions are copied into each
 * check-in, so editing the template never rewrites what a client already answered.
 */
@Service
public class CheckinService {

    static final List<String> DEFAULT_QUESTIONS = List.of(
            "¿Qué ha ido bien esta semana?",
            "¿Qué te ha costado más?",
            "¿Alguna molestia o lesión?");
    private static final int HISTORY_WEEKS = 26;
    private static final JsonMapper JSON = JsonMapper.builder().build();
    private static final TypeReference<List<String>> QUESTIONS = new TypeReference<>() {
    };
    private static final TypeReference<List<Answer>> ANSWERS = new TypeReference<>() {
    };

    private static final String COLUMNS = """
            c.id, c.link_id, c.week_start, c.weight_avg, c.energy, c.sleep, c.training_adherence,
            c.diet_adherence, c.answers::text AS answers, c.notes, c.coach_reply, c.replied_at, c.created_at,
            c.updated_at
            """;

    private final JdbcTemplate jdbcTemplate;

    public CheckinService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // ---- Coach side ----

    @Transactional(readOnly = true)
    public Template template(String coachEmail) {
        return templateOf(requireCoachId(coachEmail));
    }

    @Transactional
    public Template saveTemplate(String coachEmail, TemplateRequest request) {
        UUID coachId = requireCoachId(coachEmail);
        List<String> questions = request.questions().stream().map(String::strip).toList();
        jdbcTemplate.update("""
                INSERT INTO checkin_templates (coach_user_id, questions) VALUES (?, CAST(? AS jsonb))
                ON CONFLICT (coach_user_id) DO UPDATE SET questions = EXCLUDED.questions, updated_at = NOW()
                """, coachId, JSON.writeValueAsString(questions));
        return new Template(questions, true);
    }

    /** The client's check-ins through this link, newest first. The weight is hidden without body consent. */
    @Transactional(readOnly = true)
    public List<Checkin> forCoach(ClientAccess access) {
        return jdbcTemplate.query("""
                SELECT %s FROM checkins c WHERE c.link_id = ? ORDER BY c.week_start DESC LIMIT ?
                """.formatted(COLUMNS), checkin(access.body()), access.linkId(), HISTORY_WEEKS);
    }

    @Transactional
    public Checkin reply(ClientAccess access, UUID checkinId, String reply) {
        List<Checkin> updated = jdbcTemplate.query("""
                UPDATE checkins c SET coach_reply = ?, replied_at = NOW()
                WHERE c.id = ? AND c.link_id = ?
                RETURNING %s
                """.formatted(COLUMNS), checkin(access.body()), reply.strip(), checkinId, access.linkId());
        if (updated.isEmpty()) {
            throw new EntityNotFoundException("Check-in no encontrado");
        }
        return updated.get(0);
    }

    // ---- Client side ----

    /** This week's questions from this coach and the check-in already sent, if any. */
    @Transactional(readOnly = true)
    public ClientCheckin current(String clientEmail, UUID linkId, Instant now) {
        Link link = activeLink(clientEmail, linkId);
        LocalDate week = weekOf(now.atZone(java.time.ZoneId.of(link.followup().schedule().timeZone())).toLocalDate());
        Checkin sent = find(link, week);
        List<String> questions = sent == null
                ? templateOf(link.coachUserId()).questions()
                : sent.answers().stream().map(Answer::question).toList();
        return new ClientCheckin(linkId, link.coach(), week, questions, sent, link.followup());
    }

    @Transactional
    public Checkin submit(String clientEmail, UUID linkId, CheckinRequest request, Instant now) {
        Link link = activeLink(clientEmail, linkId);
        LocalDate week = weekOf(now.atZone(java.time.ZoneId.of(link.followup().schedule().timeZone())).toLocalDate());
        Checkin sent = find(link, week);
        if (sent != null && sent.coachReply() != null) {
            throw new InvalidInputException("Tu entrenador ya ha respondido a este check-in.");
        }
        List<String> questions = sent == null
                ? templateOf(link.coachUserId()).questions()
                : sent.answers().stream().map(Answer::question).toList();
        List<String> given = request.answers() == null ? List.of() : request.answers();
        if (given.size() > questions.size()) {
            throw new InvalidInputException("Hay más respuestas que preguntas.");
        }
        List<Answer> answers = new ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            String answer = i < given.size() && given.get(i) != null ? given.get(i).strip() : "";
            answers.add(new Answer(questions.get(i), answer));
        }
        Double weightAvg = link.body() ? jdbcTemplate.queryForObject("""
                SELECT ROUND(AVG(weight)::numeric, 2) FROM weight_entries
                WHERE user_email = ? AND date BETWEEN ? AND ?
                """, Double.class, link.clientEmail(), week, week.plusDays(6)) : null;
        String notes = request.notes() == null || request.notes().isBlank() ? null : request.notes().strip();
        jdbcTemplate.update("""
                INSERT INTO checkins (link_id, client_user_id, coach_user_id, week_start, weight_avg, energy, sleep,
                    training_adherence, diet_adherence, answers, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS jsonb), ?)
                ON CONFLICT (link_id, week_start) DO UPDATE SET weight_avg = EXCLUDED.weight_avg,
                    energy = EXCLUDED.energy, sleep = EXCLUDED.sleep,
                    training_adherence = EXCLUDED.training_adherence, diet_adherence = EXCLUDED.diet_adherence,
                    answers = EXCLUDED.answers, notes = EXCLUDED.notes, updated_at = NOW()
                """, linkId, link.clientUserId(), link.coachUserId(), week, weightAvg, request.energy(),
                request.sleep(), request.trainingAdherence(), request.dietAdherence(),
                JSON.writeValueAsString(answers), notes);
        return find(link, week);
    }

    /** What the client sent this coach and what the coach replied, newest first. Kept after the link ends. */
    @Transactional(readOnly = true)
    public List<Checkin> history(String clientEmail, UUID linkId) {
        return jdbcTemplate.query("""
                SELECT %s FROM checkins c
                WHERE c.link_id = ? AND c.client_user_id = (SELECT id FROM users WHERE email = ?)
                ORDER BY c.week_start DESC LIMIT ?
                """.formatted(COLUMNS), checkin(true), linkId, Emails.normalizeRequired(clientEmail), HISTORY_WEEKS);
    }

    // ---- GDPR export ----

    @Transactional(readOnly = true)
    public List<CheckinExport> exportFor(UUID userId) {
        return jdbcTemplate.query("""
                SELECT %s, CASE WHEN c.client_user_id = ? THEN 'CLIENT' ELSE 'COACH' END AS role,
                       u.name, u.email, u.picture
                FROM checkins c
                LEFT JOIN users u ON u.id = CASE WHEN c.client_user_id = ? THEN c.coach_user_id
                                                 ELSE c.client_user_id END
                WHERE c.client_user_id = ? OR c.coach_user_id = ?
                ORDER BY c.week_start, c.created_at
                """.formatted(COLUMNS),
                (rs, n) -> new CheckinExport(rs.getString("role"),
                        rs.getString("email") == null ? null
                                : new Person(rs.getString("name"), rs.getString("email"), rs.getString("picture")),
                        checkin(true).mapRow(rs, n)),
                userId, userId, userId, userId);
    }

    // ---- Helpers ----

    private record Link(UUID linkId, UUID coachUserId, UUID clientUserId, String clientEmail, boolean body, Person coach,
                        com.ascension.dto.CoachScheduleDtos.Followup followup) {
    }

    private Link activeLink(String clientEmail, UUID linkId) {
        List<Link> found = jdbcTemplate.query("""
                SELECT %s, cc.id, cc.coach_user_id, cc.client_user_id, cu.email AS client_email, cc.can_view_body,
                       co.name, co.email, co.picture
                FROM coach_clients cc
                JOIN users cu ON cu.id = cc.client_user_id
                JOIN users co ON co.id = cc.coach_user_id
                WHERE cc.id = ? AND cc.status = 'ACTIVE' AND cu.email = ?
                """.formatted(CoachScheduleService.COLUMNS),
                (rs, n) -> new Link(rs.getObject("id", UUID.class), rs.getObject("coach_user_id", UUID.class),
                        rs.getObject("client_user_id", UUID.class), rs.getString("client_email"),
                        rs.getBoolean("can_view_body"),
                        new Person(rs.getString("name"), rs.getString("email"), rs.getString("picture")),
                        CoachScheduleService.read(rs, Instant.now())),
                linkId, Emails.normalizeRequired(clientEmail));
        if (found.isEmpty()) {
            throw new EntityNotFoundException("Entrenador no encontrado");
        }
        return found.get(0);
    }

    private Checkin find(Link link, LocalDate week) {
        return jdbcTemplate.query("""
                SELECT %s FROM checkins c WHERE c.link_id = ? AND c.week_start = ?
                """.formatted(COLUMNS), checkin(true), link.linkId(), week)
                .stream().findFirst().orElse(null);
    }

    private UUID requireCoachId(String coachEmail) {
        List<UUID> ids = jdbcTemplate.queryForList("""
                SELECT cp.user_id FROM coach_profiles cp JOIN users u ON u.id = cp.user_id WHERE u.email = ?
                """, UUID.class, Emails.normalizeRequired(coachEmail));
        if (ids.isEmpty()) {
            throw new SecurityException("User is not a coach");
        }
        return ids.get(0);
    }

    private Template templateOf(UUID coachId) {
        String stored = jdbcTemplate.query(
                "SELECT questions::text AS questions FROM checkin_templates WHERE coach_user_id = ?",
                (rs, n) -> rs.getString("questions"), coachId).stream().findFirst().orElse(null);
        return stored == null ? new Template(DEFAULT_QUESTIONS, false) : new Template(JSON.readValue(stored, QUESTIONS), true);
    }

    static LocalDate weekOf(LocalDate day) {
        return day.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    private static RowMapper<Checkin> checkin(boolean showWeight) {
        return (rs, n) -> {
            Number weight = (Number) rs.getObject("weight_avg");
            return new Checkin(rs.getObject("id", UUID.class), rs.getObject("link_id", UUID.class),
                    rs.getObject("week_start", LocalDate.class),
                    showWeight && weight != null ? weight.doubleValue() : null,
                    rs.getInt("energy"), rs.getInt("sleep"), rs.getInt("training_adherence"),
                    rs.getInt("diet_adherence"), JSON.readValue(rs.getString("answers"), ANSWERS),
                    rs.getString("notes"), rs.getString("coach_reply"), instant(rs.getTimestamp("replied_at")),
                    instant(rs.getTimestamp("created_at")), instant(rs.getTimestamp("updated_at")));
        };
    }

    private static Instant instant(Timestamp ts) {
        return ts == null ? null : ts.toInstant();
    }

}
