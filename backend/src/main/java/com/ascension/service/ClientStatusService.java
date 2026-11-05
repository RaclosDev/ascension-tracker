package com.ascension.service;

import com.ascension.dto.ClientStatusDtos.ClientStatus;
import com.ascension.dto.ClientStatusDtos.Level;
import com.ascension.dto.ClientStatusDtos.Reason;
import com.ascension.dto.ClientStatusDtos.Signal;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Stream;

/**
 * The traffic light on the coach's client list. One query for every active client, using only what
 * each client shares with this coach:
 * <ul>
 *   <li>Days since the client last logged anything: amber from 3, red from 7.</li>
 *   <li>Finished weeks without a check-in since the link started: amber for one, red for two.</li>
 *   <li>With nutrition shared, days with food logged in the last seven: amber under 4.</li>
 * </ul>
 * Nothing here is written to the access log: it is a summary, not a look at the client's data.
 */
@Service
public class ClientStatusService {

    static final int AMBER_INACTIVE_DAYS = 3;
    static final int RED_INACTIVE_DAYS = 7;
    static final int MIN_FOOD_DAYS = 4;

    private final JdbcTemplate jdbcTemplate;

    public ClientStatusService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** What the query returns per link; dates are null when not shared or never logged. */
    record Facts(UUID linkId, LocalDate since, boolean nutrition, LocalDate lastWorkout, LocalDate lastFood,
                 LocalDate lastWeight, LocalDate lastCheckin, LocalDate lastCheckinWeek, int pendingReplies,
                 int foodDays) {
    }

    @Transactional(readOnly = true)
    public List<ClientStatus> forCoach(String coachEmail, LocalDate today) {
        UUID coachId = requireCoachId(coachEmail);
        Date weekAgo = Date.valueOf(today.minusDays(7));
        Date yesterday = Date.valueOf(today.minusDays(1));
        return jdbcTemplate.query("""
                SELECT cc.id, cc.created_at::date AS since, cc.can_view_nutrition,
                       CASE WHEN cc.can_view_training THEN (
                           SELECT MAX(to_timestamp(CASE WHEN t > 100000000000 THEN t / 1000 ELSE t END)::date)
                           FROM (SELECT COALESCE(w.finished_at, w.started_at) AS t FROM workouts w
                                 WHERE w.user_email = u.email) x) END AS last_workout,
                       CASE WHEN cc.can_view_nutrition THEN (
                           SELECT MAX(f.log_date) FROM food_logs f WHERE f.user_email = u.email) END AS last_food,
                       CASE WHEN cc.can_view_body THEN (
                           SELECT MAX(we.date) FROM weight_entries we WHERE we.user_email = u.email) END AS last_weight,
                       (SELECT MAX(c.updated_at)::date FROM checkins c WHERE c.link_id = cc.id) AS last_checkin,
                       (SELECT MAX(c.week_start) FROM checkins c WHERE c.link_id = cc.id) AS last_checkin_week,
                       (SELECT COUNT(*) FROM checkins c WHERE c.link_id = cc.id AND c.coach_reply IS NULL)
                           AS pending_replies,
                       CASE WHEN cc.can_view_nutrition THEN (
                           SELECT COUNT(DISTINCT f.log_date) FROM food_logs f
                           WHERE f.user_email = u.email AND f.log_date BETWEEN ? AND ?) ELSE 0 END AS food_days
                FROM coach_clients cc JOIN users u ON u.id = cc.client_user_id
                WHERE cc.coach_user_id = ? AND cc.status = 'ACTIVE'
                """,
                (rs, n) -> evaluate(new Facts(rs.getObject("id", UUID.class), date(rs.getDate("since")),
                        rs.getBoolean("can_view_nutrition"), date(rs.getDate("last_workout")),
                        date(rs.getDate("last_food")), date(rs.getDate("last_weight")),
                        date(rs.getDate("last_checkin")), date(rs.getDate("last_checkin_week")),
                        rs.getInt("pending_replies"), rs.getInt("food_days")), today),
                weekAgo, yesterday, coachId);
    }

    static ClientStatus evaluate(Facts facts, LocalDate today) {
        List<Signal> signals = new ArrayList<>();

        LocalDate lastActivity = Stream.of(facts.lastWorkout(), facts.lastFood(), facts.lastWeight(),
                        facts.lastCheckin())
                .filter(Objects::nonNull).max(Comparator.naturalOrder()).orElse(null);
        LocalDate reference = lastActivity == null || lastActivity.isBefore(facts.since())
                ? facts.since() : lastActivity;
        int idle = (int) Math.max(0, ChronoUnit.DAYS.between(reference, today));
        if (idle >= RED_INACTIVE_DAYS) {
            signals.add(new Signal(Reason.INACTIVE, Level.RED, idle));
        } else if (idle >= AMBER_INACTIVE_DAYS) {
            signals.add(new Signal(Reason.INACTIVE, Level.AMBER, idle));
        }

        int missing = missingCheckins(facts, today);
        if (missing > 0) {
            signals.add(new Signal(Reason.CHECKIN_MISSING, missing >= 2 ? Level.RED : Level.AMBER, missing));
        }

        if (facts.nutrition() && !facts.since().isAfter(today.minusDays(7)) && facts.foodDays() < MIN_FOOD_DAYS) {
            signals.add(new Signal(Reason.FEW_FOOD_LOGS, Level.AMBER, facts.foodDays()));
        }

        Level level = signals.stream().map(Signal::level).max(Comparator.naturalOrder()).orElse(Level.GREEN);
        return new ClientStatus(facts.linkId(), level, lastActivity, facts.pendingReplies(), signals);
    }

    /** Finished weeks (last week and the one before) without a check-in, counting only since the link started. */
    private static int missingCheckins(Facts facts, LocalDate today) {
        LocalDate firstWeek = CheckinService.weekOf(facts.since());
        int missing = 0;
        for (LocalDate week = CheckinService.weekOf(today).minusWeeks(1); missing < 2; week = week.minusWeeks(1)) {
            if (week.isBefore(firstWeek)) break;
            if (facts.lastCheckinWeek() != null && !facts.lastCheckinWeek().isBefore(week)) break;
            missing++;
        }
        return missing;
    }

    private UUID requireCoachId(String coachEmail) {
        List<UUID> ids = jdbcTemplate.queryForList("""
                SELECT cp.user_id FROM coach_profiles cp JOIN users u ON u.id = cp.user_id WHERE u.email = ?
                """, UUID.class, coachEmail == null ? "" : coachEmail.trim().toLowerCase(Locale.ROOT));
        if (ids.isEmpty()) {
            throw new SecurityException("User is not a coach");
        }
        return ids.get(0);
    }

    private static LocalDate date(Date date) {
        return date == null ? null : date.toLocalDate();
    }
}
