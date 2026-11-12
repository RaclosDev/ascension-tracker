package com.ascension.service;

import com.ascension.util.Emails;
import com.ascension.dto.ClientStatusDtos.ClientStatus;
import com.ascension.dto.ClientStatusDtos.Level;
import com.ascension.dto.ClientStatusDtos.Reason;
import com.ascension.dto.ClientStatusDtos.Signal;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.Instant;
import java.time.ZoneId;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Stream;

/**
 * The traffic light on the coach's client list. One query for every active client, using only what
 * each client shares with this coach:
 * <ul>
 *   <li>Days since the client last logged anything: amber from 3, red from 7.</li>
 *   <li>Missed scheduled check-ins after the incorporation or resumption grace period: amber for one, red for two.</li>
 *   <li>With nutrition shared, days with food logged in the last seven: amber under 4.</li>
 *   <li>With body data shared and a weight goal that is still over 1 kg away, the average weight of the last
 *       week has moved less than 0.3 kg towards it compared with three weeks earlier: amber.</li>
 *   <li>The coach may edit the training (or nutrition) but has no active program (or nutrition plan) for the
 *       client yet: amber, so new clients show up as «to plan» instead of «up to date».</li>
 * </ul>
 * Nothing here is written to the access log: it is a summary, not a look at the client's data.
 */
@Service
public class ClientStatusService {

    static final int AMBER_INACTIVE_DAYS = 3;
    static final int RED_INACTIVE_DAYS = 7;
    static final int MIN_FOOD_DAYS = 4;
    static final int STALL_WEEKS = 3;
    static final double STALL_MIN_PROGRESS_KG = 0.3;
    static final double NEAR_GOAL_KG = 1.0;

    private final JdbcTemplate jdbcTemplate;

    public ClientStatusService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** What the query returns per link; dates are null when not shared or never logged. */
    record Facts(UUID linkId, LocalDate since, boolean nutrition, LocalDate lastWorkout, LocalDate lastFood,
                 LocalDate lastWeight, LocalDate lastCheckin, int missingCheckins, int pendingReplies,
                 int foodDays, Double recentWeight, Double earlierWeight, Double goalWeight,
                 boolean needsProgram, boolean needsNutritionPlan) {
    }

    @Transactional(readOnly = true)
    public List<ClientStatus> forCoach(String coachEmail, Instant now) {
        return statuses(coachEmail, now, null);
    }

    @Transactional(readOnly = true)
    public ClientStatus forClient(String coachEmail, UUID linkId, Instant now) {
        return statuses(coachEmail, now, linkId).stream().findFirst()
                .orElseThrow(() -> new com.ascension.exception.EntityNotFoundException("Atleta no encontrado"));
    }

    private List<ClientStatus> statuses(String coachEmail, Instant now, UUID linkId) {
        UUID coachId = requireCoachId(coachEmail);
        return jdbcTemplate.query("""
                SELECT %s, cc.id, clock.today,
                       cc.coaching_setup IS NOT NULL AS configured,
                       COALESCE((cc.coaching_setup ->> 'reviewed')::boolean, false) AS reviewed,
                       cc.can_view_nutrition AND cc.coaching_setup #>> '{services,nutrition}' = 'true' AS can_view_nutrition,
                       CASE WHEN cc.can_view_training THEN (
                           SELECT MAX((to_timestamp(CASE WHEN t > 100000000000 THEN t / 1000 ELSE t END)
                               AT TIME ZONE cc.review_zone)::date)
                           FROM (SELECT COALESCE(w.finished_at, w.started_at) AS t FROM workouts w
                                 WHERE w.user_email = u.email) x) END AS last_workout,
                       CASE WHEN cc.can_view_nutrition THEN (
                           SELECT MAX(f.log_date) FROM food_logs f WHERE f.user_email = u.email) END AS last_food,
                       CASE WHEN cc.can_view_body THEN (
                           SELECT MAX(we.date) FROM weight_entries we WHERE we.user_email = u.email) END AS last_weight,
                       (SELECT (MAX(c.updated_at) AT TIME ZONE cc.review_zone)::date FROM checkins c WHERE c.link_id = cc.id) AS last_checkin,
                       (SELECT MAX(c.week_start) FROM checkins c WHERE c.link_id = cc.id) AS last_checkin_week,
                       (SELECT COUNT(*) FROM checkins c WHERE c.link_id = cc.id AND (c.coach_reply IS NULL OR c.updated_at > c.replied_at))
                           AS pending_replies,
                       CASE WHEN cc.can_view_nutrition THEN (
                           SELECT COUNT(DISTINCT f.log_date) FROM food_logs f
                           WHERE f.user_email = u.email AND f.log_date BETWEEN clock.today - 7 AND clock.today - 1) ELSE 0 END AS food_days,
                       CASE WHEN cc.can_view_body THEN (
                           SELECT AVG(we.weight) FROM weight_entries we
                           WHERE we.user_email = u.email AND we.date BETWEEN clock.today - 6 AND clock.today) END AS recent_weight,
                       CASE WHEN cc.can_view_body THEN (
                           SELECT AVG(we.weight) FROM weight_entries we
                           WHERE we.user_email = u.email AND we.date BETWEEN clock.today - 27 AND clock.today - 21) END AS earlier_weight,
                       CASE WHEN cc.can_view_body THEN (
                           SELECT s.goal_weight FROM user_settings s
                           WHERE s.user_email = u.email AND s.weekly_goal <> 0 AND s.goal_weight > 0
                             AND cc.coaching_setup #>> '{services,progress}' = 'true'
                             AND COALESCE(cc.coaching_setup ->> 'goalFocus', 'WEIGHT_CHANGE') = 'WEIGHT_CHANGE'
                             AND NOT EXISTS (SELECT 1 FROM coach_powerlifting_profiles pp
                                 WHERE pp.link_id = cc.id AND pp.content ->> 'enabled' = 'true'
                                   AND cc.coaching_setup #>> '{services,nutrition}' <> 'true')) END AS goal_weight,
                       cc.coaching_setup #>> '{services,training}' = 'true' AND cc.can_edit_training AND NOT EXISTS (
                           SELECT 1 FROM program_assignments pa
                           JOIN programs p ON p.id = pa.program_id
                           WHERE pa.coach_link_id = cc.id AND pa.status = 'ACTIVE'
                             AND pa.start_date <= clock.today
                             AND (pa.effective_until IS NULL OR pa.effective_until > clock.today)
                             AND date_trunc('week', pa.start_date)::date + p.weeks * 7 > clock.today) AS needs_program,
                       CASE WHEN NOT cc.can_view_training THEN NULL
                         WHEN EXISTS (SELECT 1 FROM coach_week_plans wp WHERE wp.link_id = cc.id
                           AND wp.week_start = date_trunc('week', clock.today)::date + 7
                           AND wp.version > COALESCE(wp.published_version, 0)) THEN 'DRAFT'
                         WHEN EXISTS (SELECT 1 FROM program_assignments pa JOIN programs p ON p.id = pa.program_id
                           WHERE pa.coach_link_id = cc.id AND pa.status = 'ACTIVE'
                             AND pa.start_date < date_trunc('week', clock.today)::date + 14
                             AND (pa.effective_until IS NULL OR pa.effective_until > date_trunc('week', clock.today)::date + 7)
                             AND date_trunc('week', pa.start_date)::date + p.weeks * 7 > date_trunc('week', clock.today)::date + 7)
                           THEN 'SCHEDULED' ELSE 'MISSING' END AS next_week_status,
                       cc.coaching_setup #>> '{services,nutrition}' = 'true' AND cc.can_edit_nutrition AND NOT EXISTS (
                           SELECT 1 FROM nutrition_plans np
                           WHERE np.coach_link_id = cc.id AND np.status = 'ACTIVE') AS needs_nutrition_plan
                FROM coach_clients cc JOIN users u ON u.id = cc.client_user_id
                CROSS JOIN LATERAL (SELECT (?::timestamptz AT TIME ZONE cc.review_zone)::date AS today) clock
                WHERE cc.coach_user_id = ? AND cc.status = 'ACTIVE'
                  AND (?::uuid IS NULL OR cc.id = ?)
                """.formatted(CoachScheduleService.COLUMNS),
                (rs, n) -> {
                    var followup = CoachScheduleService.read(rs, now);
                    LocalDate since = followup.startedAt().atZone(ZoneId.of(followup.schedule().timeZone())).toLocalDate();
                    int missing = rs.getBoolean("reviewed")
                            ? CoachScheduleService.missing(followup, date(rs.getDate("last_checkin_week")), now) : 0;
                    ClientStatus evaluated = configuredStatus(evaluate(new Facts(rs.getObject("id", UUID.class), since,
                        rs.getBoolean("can_view_nutrition"), date(rs.getDate("last_workout")),
                        date(rs.getDate("last_food")), date(rs.getDate("last_weight")),
                        date(rs.getDate("last_checkin")), missing,
                        rs.getInt("pending_replies"), rs.getInt("food_days"),
                        rs.getObject("recent_weight", Double.class), rs.getObject("earlier_weight", Double.class),
                        rs.getObject("goal_weight", Double.class), rs.getBoolean("needs_program"),
                        rs.getBoolean("needs_nutrition_plan")), date(rs.getDate("today"))),
                            rs.getBoolean("configured") && !followup.schedule().paused());
                    return new ClientStatus(evaluated.linkId(), evaluated.level(), evaluated.lastActivity(), evaluated.pendingReplies(),
                            evaluated.signals(), evaluated.weightChange(), date(rs.getDate("last_workout")),
                            date(rs.getDate("last_checkin")), rs.getString("next_week_status"));
                }, java.time.OffsetDateTime.ofInstant(now, java.time.ZoneOffset.UTC), coachId, linkId, linkId);
    }

    private static ClientStatus configuredStatus(ClientStatus status, boolean configured) {
        return configured ? status : new ClientStatus(status.linkId(), Level.GREEN, status.lastActivity(),
                status.pendingReplies(), List.of(), status.weightChange(), status.lastWorkout(), status.lastCheckin(), status.nextWeekStatus());
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

        int missing = facts.missingCheckins();
        if (missing > 0) {
            signals.add(new Signal(Reason.CHECKIN_MISSING, missing >= 2 ? Level.RED : Level.AMBER, missing));
        }

        if (facts.nutrition() && !facts.since().isAfter(today.minusDays(7)) && facts.foodDays() < MIN_FOOD_DAYS) {
            signals.add(new Signal(Reason.FEW_FOOD_LOGS, Level.AMBER, facts.foodDays()));
        }

        if (weightStalled(facts)) {
            signals.add(new Signal(Reason.WEIGHT_STALLED, Level.AMBER, STALL_WEEKS));
        }

        if (facts.needsProgram()) {
            signals.add(new Signal(Reason.NO_PROGRAM, Level.AMBER, 0));
        }
        if (facts.needsNutritionPlan()) {
            signals.add(new Signal(Reason.NO_NUTRITION_PLAN, Level.AMBER, 0));
        }

        Level level = signals.stream().map(Signal::level).max(Comparator.naturalOrder()).orElse(Level.GREEN);
        return new ClientStatus(facts.linkId(), level, lastActivity, facts.pendingReplies(), signals,
                weightChange(facts), facts.lastWorkout(), facts.lastCheckin(), null);
    }

    /** Last week's average weight against the one three weeks before, rounded to 0.1 kg. */
    private static Double weightChange(Facts facts) {
        if (facts.recentWeight() == null || facts.earlierWeight() == null) {
            return null;
        }
        return Math.round((facts.recentWeight() - facts.earlierWeight()) * 10) / 10.0;
    }

    /** Still over 1 kg from the goal and less than 0.3 kg closer to it than three weeks ago. */
    private static boolean weightStalled(Facts facts) {
        if (facts.recentWeight() == null || facts.earlierWeight() == null || facts.goalWeight() == null) {
            return false;
        }
        double distance = facts.goalWeight() - facts.recentWeight();
        if (Math.abs(distance) <= NEAR_GOAL_KG) {
            return false;
        }
        double progress = (facts.recentWeight() - facts.earlierWeight()) * Math.signum(distance);
        return progress < STALL_MIN_PROGRESS_KG;
    }

    private UUID requireCoachId(String coachEmail) {
        List<UUID> ids = jdbcTemplate.queryForList("""
                SELECT cp.user_id FROM coach_profiles cp JOIN users u ON u.id = cp.user_id WHERE u.email = ?
                """, UUID.class, Emails.normalize(coachEmail));
        if (ids.isEmpty()) {
            throw new SecurityException("User is not a coach");
        }
        return ids.get(0);
    }

    private static LocalDate date(Date date) {
        return date == null ? null : date.toLocalDate();
    }
}
