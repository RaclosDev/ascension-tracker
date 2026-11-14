package com.ascension.service;

import com.ascension.dto.CoachScheduleDtos.Followup;
import com.ascension.dto.CoachScheduleDtos.Schedule;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.util.Emails;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.UUID;

@Service
public class CoachScheduleService {
    public static final String COLUMNS = """
            cc.review_day, cc.review_time, cc.review_zone, cc.followup_paused,
            COALESCE(cc.coaching_setup ->> 'reviewed', 'false') = 'true' AS schedule_confirmed,
            GREATEST(cc.created_at, cc.setup_started_at, cc.followup_started_at) AS followup_started
            """;
    private final JdbcTemplate jdbc;

    public CoachScheduleService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Transactional
    public Followup save(String coachEmail, UUID linkId, Schedule schedule) {
        int updated = jdbc.update("""
                UPDATE coach_clients SET
                    followup_started_at = CASE WHEN
                        (review_day, review_time, review_zone) IS DISTINCT FROM (?, ?::time, ?)
                        OR (followup_paused AND NOT ?) THEN NOW() ELSE followup_started_at END,
                    review_day = ?, review_time = ?::time, review_zone = ?, followup_paused = ?
                WHERE id = ? AND status = 'ACTIVE'
                  AND coach_user_id = (SELECT id FROM users WHERE email = ?)
                """, schedule.day(), schedule.time().toString(), schedule.timeZone(), schedule.paused(),
                schedule.day(), schedule.time().toString(), schedule.timeZone(), schedule.paused(),
                linkId, Emails.normalizeRequired(coachEmail));
        if (updated == 0) throw new EntityNotFoundException("Atleta no encontrado");
        return jdbc.queryForObject("SELECT " + COLUMNS + " FROM coach_clients cc WHERE cc.id = ?",
                (rs, n) -> read(rs, Instant.now()), linkId);
    }

    public static Followup read(ResultSet rs, Instant now) throws SQLException {
        Schedule schedule = new Schedule(rs.getInt("review_day"), rs.getObject("review_time", LocalTime.class),
                rs.getString("review_zone"), rs.getBoolean("followup_paused"));
        Instant started = rs.getTimestamp("followup_started").toInstant();
        return new Followup(schedule, started, rs.getBoolean("schedule_confirmed") ? nextDue(schedule, started, now) : null);
    }

    public static ZonedDateTime deadline(Schedule schedule, LocalDate week) {
        return week.plusDays(schedule.day() - 1L).atTime(schedule.time()).atZone(ZoneId.of(schedule.timeZone()));
    }

    private static Instant firstDue(Schedule schedule, Instant started) {
        ZonedDateTime earliest = started.atZone(ZoneId.of(schedule.timeZone())).plusDays(7);
        ZonedDateTime due = deadline(schedule, CheckinService.weekOf(earliest.toLocalDate()));
        return (due.isBefore(earliest) ? due.plusWeeks(1) : due).toInstant();
    }

    public static Instant nextDue(Schedule schedule, Instant started, Instant now) {
        if (schedule.paused()) return null;
        LocalDate today = now.atZone(ZoneId.of(schedule.timeZone())).toLocalDate();
        Instant due = deadline(schedule, CheckinService.weekOf(today)).toInstant();
        if (due.isBefore(now)) due = deadline(schedule, CheckinService.weekOf(today).plusWeeks(1)).toInstant();
        Instant first = firstDue(schedule, started);
        return due.isBefore(first) ? first : due;
    }

    public static int missing(Followup followup, LocalDate lastCheckinWeek, Instant now) {
        Schedule schedule = followup.schedule();
        if (schedule.paused()) return 0;
        LocalDate week = CheckinService.weekOf(now.atZone(ZoneId.of(schedule.timeZone())).toLocalDate());
        if (deadline(schedule, week).toInstant().isAfter(now)) week = week.minusWeeks(1);
        Instant first = firstDue(schedule, followup.startedAt());
        int count = 0;
        while (count < 2 && !deadline(schedule, week).toInstant().isBefore(first)
                && (lastCheckinWeek == null || lastCheckinWeek.isBefore(week))) {
            count++;
            week = week.minusWeeks(1);
        }
        return count;
    }

    public static boolean reminderDue(Followup followup, Instant now) {
        LocalDate week = CheckinService.weekOf(now.atZone(ZoneId.of(followup.schedule().timeZone())).toLocalDate());
        Instant due = deadline(followup.schedule(), week).toInstant();
        return !followup.schedule().paused() && !due.isAfter(now) && !due.isBefore(firstDue(followup.schedule(), followup.startedAt()));
    }
}
