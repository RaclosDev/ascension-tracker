package com.ascension.service;

import com.ascension.dto.CheckinDtos.Checkin;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Push notifications for weekly check-ins and scheduled reminders. */
@Slf4j
@Service
public class CheckinNotifier {

    private final JdbcTemplate jdbcTemplate;
    private final PushNotificationService push;

    public CheckinNotifier(JdbcTemplate jdbcTemplate, PushNotificationService push) {
        this.jdbcTemplate = jdbcTemplate;
        this.push = push;
    }

    private record Parties(String clientEmail, String clientName, String coachEmail, String coachName) {
    }

    /** Tells the coach a client sent this week's check-in. Later edits by the client do not notify again. */
    public void submitted(UUID linkId, Checkin checkin) {
        if (!checkin.createdAt().equals(checkin.updatedAt())) return;
        parties(linkId).ifPresent(p -> push.sendAsync(p.coachEmail(), "Nuevo check-in",
                firstName(p.clientName()) + " ha enviado su check-in semanal.",
                "ascension-checkin-" + linkId, "/entrenador/atletas/" + linkId));
    }

    /** Tells the client their coach answered a check-in. */
    public void replied(UUID linkId) {
        parties(linkId).ifPresent(p -> push.sendAsync(p.clientEmail(), "Tu entrenador ha respondido",
                firstName(p.coachName()) + " ha contestado a tu check-in.",
                "ascension-checkin-" + linkId, "/checkin/" + linkId));
    }

    @Scheduled(cron = "${app.coach.checkin-reminder-cron:0 */5 * * * *}")
    public void remindPendingCheckins() {
        try {
            remind(Instant.now());
        } catch (Exception e) {
            log.error("Failed to send weekly check-in reminders", e);
        }
    }

    private record Candidate(UUID linkId, com.ascension.dto.CoachScheduleDtos.Followup followup) { }

    int remind(Instant now) {
        List<Candidate> candidates = jdbcTemplate.query("""
                SELECT cc.id, %s FROM coach_clients cc
                WHERE cc.status = 'ACTIVE' AND NOT cc.followup_paused
                  AND cc.coaching_setup ->> 'reviewed' = 'true'
                """.formatted(CoachScheduleService.COLUMNS),
                (rs, n) -> new Candidate(rs.getObject("id", UUID.class), CoachScheduleService.read(rs, now)));
        int sent = 0;
        for (Candidate candidate : candidates) {
            if (!CoachScheduleService.reminderDue(candidate.followup(), now)) continue;
            var schedule = candidate.followup().schedule();
            var week = CheckinService.weekOf(now.atZone(ZoneId.of(schedule.timeZone())).toLocalDate());
            int claimed = jdbcTemplate.update("""
                    INSERT INTO checkin_reminders (link_id, week_start)
                    SELECT cc.id, ? FROM coach_clients cc
                    WHERE cc.id = ? AND cc.status = 'ACTIVE' AND NOT cc.followup_paused
                      AND cc.review_day = ? AND cc.review_time = ?::time AND cc.review_zone = ?
                      AND cc.coaching_setup ->> 'reviewed' = 'true'
                      AND GREATEST(cc.created_at, cc.setup_started_at, cc.followup_started_at) = ?
                      AND NOT EXISTS (SELECT 1 FROM checkins c WHERE c.link_id = cc.id AND c.week_start = ?)
                    ON CONFLICT DO NOTHING
                    """, week, candidate.linkId(), schedule.day(), schedule.time().toString(), schedule.timeZone(), java.sql.Timestamp.from(candidate.followup().startedAt()), week);
            if (claimed == 0) continue;
            sent++;
            parties(candidate.linkId()).ifPresent(p -> push.sendAsync(p.clientEmail(), "Check-in semanal",
                    "Cuéntale a " + firstName(p.coachName()) + " cómo te ha ido la semana.",
                    "ascension-checkin-" + candidate.linkId(), "/checkin/" + candidate.linkId()));
        }
        return sent;
    }

    private Optional<Parties> parties(UUID linkId) {
        return jdbcTemplate.query("""
                SELECT cl.email AS client_email, cl.name AS client_name, co.email AS coach_email, co.name AS coach_name
                FROM coach_clients cc
                JOIN users cl ON cl.id = cc.client_user_id
                JOIN users co ON co.id = cc.coach_user_id
                WHERE cc.id = ?
                """, (rs, n) -> new Parties(rs.getString("client_email"), rs.getString("client_name"),
                rs.getString("coach_email"), rs.getString("coach_name")), linkId).stream().findFirst();
    }

    private static String firstName(String name) {
        if (name == null || name.isBlank()) return "Tu entrenador";
        return name.strip().split("\s+")[0];
    }
}
