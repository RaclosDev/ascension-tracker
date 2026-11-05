package com.ascension.service;

import com.ascension.dto.CheckinDtos.Checkin;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Push notifications around weekly check-ins: new check-in, coach reply and the Sunday reminder. */
@Slf4j
@Service
public class CheckinNotifier {

    private final JdbcTemplate jdbcTemplate;
    private final PushNotificationService push;
    private final ZoneId zone;

    public CheckinNotifier(JdbcTemplate jdbcTemplate, PushNotificationService push,
                           @Value("${app.coach.checkin-reminder-zone:Europe/Madrid}")
                           String zone) {
        this.jdbcTemplate = jdbcTemplate;
        this.push = push;
        this.zone = ZoneId.of(zone);
    }

    private record Parties(String clientEmail, String clientName, String coachEmail, String coachName) {
    }

    /** Tells the coach a client sent this week's check-in. Later edits by the client do not notify again. */
    public void submitted(UUID linkId, Checkin checkin) {
        if (!checkin.createdAt().equals(checkin.updatedAt())) return;
        parties(linkId).ifPresent(p -> push.sendAsync(p.coachEmail(), "Nuevo check-in",
                firstName(p.clientName()) + " ha enviado su check-in semanal.",
                "ascension-checkin-" + linkId, "/entrenador/alumnos/" + linkId));
    }

    /** Tells the client their coach answered a check-in. */
    public void replied(UUID linkId) {
        parties(linkId).ifPresent(p -> push.sendAsync(p.clientEmail(), "Tu entrenador ha respondido",
                firstName(p.coachName()) + " ha contestado a tu check-in.",
                "ascension-checkin-" + linkId, "/checkin/" + linkId));
    }

    /** Sunday evening: reminds every active client who has not sent this week's check-in yet. */
    @Scheduled(cron = "${app.coach.checkin-reminder-cron:0 0 18 * * SUN}",
            zone = "${app.coach.checkin-reminder-zone:Europe/Madrid}")
    public void remindPendingCheckins() {
        try {
            remind(LocalDate.now(zone));
        } catch (Exception e) {
            log.error("Failed to send weekly check-in reminders", e);
        }
    }

    /** Claims and sends the reminders for the week of {@code today}; returns how many were sent. */
    int remind(LocalDate today) {
        LocalDate week = CheckinService.weekOf(today);
        List<UUID> claimed = jdbcTemplate.queryForList("""
                INSERT INTO checkin_reminders (link_id, week_start)
                SELECT cc.id, ? FROM coach_clients cc
                WHERE cc.status = 'ACTIVE'
                  AND NOT EXISTS (SELECT 1 FROM checkins c WHERE c.link_id = cc.id AND c.week_start = ?)
                ON CONFLICT DO NOTHING
                RETURNING link_id
                """, UUID.class, week, week);
        for (UUID linkId : claimed) {
            parties(linkId).ifPresent(p -> push.sendAsync(p.clientEmail(), "Check-in semanal",
                    "Cuéntale a " + firstName(p.coachName()) + " cómo te ha ido la semana.",
                    "ascension-checkin-" + linkId, "/checkin/" + linkId));
        }
        return claimed.size();
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
