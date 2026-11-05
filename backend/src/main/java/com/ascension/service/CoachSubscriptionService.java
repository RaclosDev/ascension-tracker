package com.ascension.service;

import com.ascension.config.CoachPlanProperties;
import com.ascension.dto.AdminDtos.AdminCoach;
import com.ascension.dto.AdminDtos.CoachPlans;
import com.ascension.dto.AdminDtos.PlanChange;
import com.ascension.dto.AdminDtos.PlanInfo;
import com.ascension.dto.CoachSubscriptionDtos.Subscription;
import com.ascension.dto.CoachSubscriptionDtos.SubscriptionExport;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.exception.InvalidInputException;
import com.ascension.service.ai.AiDailyLimitResolver;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Which plan a coach is on and the limits it gives: how many active clients they can have, and the
 * daily AI quota for them and for their linked clients. Payments are not wired yet, so a coach starts
 * on a trial and falls back to the free plan when it ends.
 */
@Service
public class CoachSubscriptionService implements AiDailyLimitResolver {

    private static final String SELECT_ROW = """
            SELECT coach_user_id, plan, status, trial_ends_at, current_period_end FROM coach_subscriptions
            """;
    private static final String ADMIN_SELECT = """
            SELECT cp.user_id, u.name, u.email, s.plan, s.status, s.trial_ends_at, s.current_period_end,
                   (SELECT COUNT(*) FROM coach_clients cc
                    WHERE cc.coach_user_id = cp.user_id AND cc.status = 'ACTIVE') AS active_clients
            FROM coach_profiles cp
            JOIN users u ON u.id = cp.user_id
            LEFT JOIN coach_subscriptions s ON s.coach_user_id = cp.user_id
            """;
    private static final ZoneId BILLING_ZONE = ZoneId.of("Europe/Madrid");
    private static final int MAX_PAID_DAYS = 400;

    private final JdbcTemplate jdbcTemplate;
    private final CoachPlanProperties properties;

    public CoachSubscriptionService(JdbcTemplate jdbcTemplate, CoachPlanProperties properties) {
        this.jdbcTemplate = jdbcTemplate;
        this.properties = properties;
    }

    private record Row(UUID coachId, String plan, String status, Instant trialEndsAt, Instant currentPeriodEnd) {
    }

    /** Starts the trial the first time someone becomes a coach; becoming one again never restarts it. */
    void startTrial(UUID coachId) {
        Instant trialEnds = Instant.now().plus(Duration.ofDays(properties.getTrialDays()));
        jdbcTemplate.update("""
                INSERT INTO coach_subscriptions (coach_user_id, plan, status, trial_ends_at)
                VALUES (?, ?, 'TRIALING', ?)
                ON CONFLICT (coach_user_id) DO NOTHING
                """, coachId, properties.getTrialPlan(), Timestamp.from(trialEnds));
    }

    /** How many active clients this coach may have under the plan that applies now. */
    int maxClients(UUID coachId) {
        return properties.plan(effectivePlan(find(coachId))).getMaxClients();
    }

    public Subscription summary(UUID coachId) {
        Row row = find(coachId);
        String effective = effectivePlan(row);
        CoachPlanProperties.Plan limits = properties.plan(effective);
        Integer active = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM coach_clients WHERE coach_user_id = ? AND status = 'ACTIVE'",
                Integer.class, coachId);
        return new Subscription(
                row == null ? properties.getFreePlan() : row.plan(),
                row == null ? "FREE" : row.status(),
                effective, limits.getMaxClients(), active == null ? 0 : active, limits.getAiDailyLimit(),
                row == null ? null : row.trialEndsAt(), row == null ? null : row.currentPeriodEnd());
    }

    /**
     * The highest AI quota among the user's own coach plan and the plans of the coaches they are
     * actively linked to; 0 when the user is neither a coach nor a linked client.
     */
    @Override
    public int dailyLimitFor(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            return 0;
        }
        List<Row> rows = jdbcTemplate.query(SELECT_ROW + """
                WHERE coach_user_id IN (
                    SELECT u.id FROM users u JOIN coach_profiles cp ON cp.user_id = u.id WHERE u.email = ?
                    UNION
                    SELECT cc.coach_user_id FROM coach_clients cc JOIN users u ON u.id = cc.client_user_id
                    WHERE u.email = ? AND cc.status = 'ACTIVE')
                """, CoachSubscriptionService::row, normalize(userEmail), normalize(userEmail));
        int limit = 0;
        for (Row row : rows) {
            limit = Math.max(limit, properties.plan(effectivePlan(row)).getAiDailyLimit());
        }
        return limit;
    }

    /** Every coach with their plan, for the back office. */
    public CoachPlans adminOverview() {
        List<PlanInfo> plans = properties.getPlans().entrySet().stream()
                .map(e -> new PlanInfo(e.getKey(), e.getValue().getMaxClients(), e.getValue().getAiDailyLimit()))
                .toList();
        List<AdminCoach> coaches = jdbcTemplate.query(ADMIN_SELECT + " ORDER BY u.email",
                (rs, n) -> adminCoach(rs));
        return new CoachPlans(plans, coaches);
    }

    /**
     * Sets a coach's plan by hand, e.g. after a bank transfer: a paid plan runs through {@code paidUntil}
     * (Europe/Madrid), the free plan has no end date.
     */
    @Transactional
    public AdminCoach setPlan(UUID coachId, PlanChange change) {
        String plan = properties.planId(change.plan());
        if (plan == null) {
            throw new InvalidInputException("Ese plan no existe.");
        }
        Integer coaches = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM coach_profiles WHERE user_id = ?",
                Integer.class, coachId);
        if (coaches == null || coaches == 0) {
            throw new EntityNotFoundException("Entrenador no encontrado");
        }
        boolean free = plan.equalsIgnoreCase(properties.getFreePlan());
        Timestamp periodEnd = null;
        if (!free) {
            LocalDate today = LocalDate.now(BILLING_ZONE);
            LocalDate paidUntil = change.paidUntil();
            if (paidUntil == null || paidUntil.isBefore(today) || paidUntil.isAfter(today.plusDays(MAX_PAID_DAYS))) {
                throw new InvalidInputException("Indica hasta qué día está pagado (de hoy a un año y un mes).");
            }
            periodEnd = Timestamp.from(paidUntil.plusDays(1).atStartOfDay(BILLING_ZONE).toInstant());
        }
        jdbcTemplate.update("""
                INSERT INTO coach_subscriptions (coach_user_id, plan, status, current_period_end)
                VALUES (?, ?, ?, ?)
                ON CONFLICT (coach_user_id) DO UPDATE
                SET plan = EXCLUDED.plan, status = EXCLUDED.status,
                    current_period_end = EXCLUDED.current_period_end, updated_at = NOW()
                """, coachId, plan, free ? "FREE" : "ACTIVE", periodEnd);
        return jdbcTemplate.queryForObject(ADMIN_SELECT + " WHERE cp.user_id = ?", (rs, n) -> adminCoach(rs), coachId);
    }

    private AdminCoach adminCoach(ResultSet rs) throws SQLException {
        UUID coachId = rs.getObject("user_id", UUID.class);
        String status = rs.getString("status");
        Row row = status == null ? null : new Row(coachId, rs.getString("plan"), status,
                instant(rs, "trial_ends_at"), instant(rs, "current_period_end"));
        String effective = effectivePlan(row);
        return new AdminCoach(coachId, rs.getString("name"), rs.getString("email"),
                row == null ? properties.getFreePlan() : row.plan(), row == null ? "FREE" : row.status(),
                effective, properties.plan(effective).getMaxClients(), rs.getInt("active_clients"),
                row == null ? null : row.trialEndsAt(), row == null ? null : row.currentPeriodEnd());
    }

    public SubscriptionExport exportFor(UUID userId) {
        List<SubscriptionExport> rows = jdbcTemplate.query("""
                SELECT plan, status, trial_ends_at, current_period_end, stripe_customer_id, stripe_subscription_id,
                       created_at, updated_at
                FROM coach_subscriptions WHERE coach_user_id = ?
                """,
                (rs, n) -> new SubscriptionExport(rs.getString("plan"), rs.getString("status"),
                        instant(rs, "trial_ends_at"), instant(rs, "current_period_end"),
                        rs.getString("stripe_customer_id"), rs.getString("stripe_subscription_id"),
                        instant(rs, "created_at"), instant(rs, "updated_at")),
                userId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private Row find(UUID coachId) {
        List<Row> rows = jdbcTemplate.query(SELECT_ROW + " WHERE coach_user_id = ?",
                CoachSubscriptionService::row, coachId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    /**
     * The plan whose limits apply now. A trial counts until it ends, an active or canceled plan until
     * the paid period ends; a payment that failed keeps the plan while the provider retries.
     */
    private String effectivePlan(Row row) {
        if (row == null) {
            return properties.getFreePlan();
        }
        Instant now = Instant.now();
        boolean applies = switch (row.status()) {
            case "TRIALING" -> row.trialEndsAt() != null && row.trialEndsAt().isAfter(now);
            // A plan set by hand after a transfer runs until the paid period ends.
            case "ACTIVE" -> row.currentPeriodEnd() == null || row.currentPeriodEnd().isAfter(now);
            case "PAST_DUE" -> true;
            case "CANCELED" -> row.currentPeriodEnd() != null && row.currentPeriodEnd().isAfter(now);
            default -> false;
        };
        return applies ? row.plan() : properties.getFreePlan();
    }

    private static Row row(ResultSet rs, int n) throws SQLException {
        return new Row(rs.getObject("coach_user_id", UUID.class), rs.getString("plan"), rs.getString("status"),
                instant(rs, "trial_ends_at"), instant(rs, "current_period_end"));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        Timestamp ts = rs.getTimestamp(column);
        return ts == null ? null : ts.toInstant();
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
