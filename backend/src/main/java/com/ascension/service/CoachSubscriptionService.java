package com.ascension.service;

import com.ascension.config.CoachPlanProperties;
import com.ascension.dto.CoachSubscriptionDtos.Subscription;
import com.ascension.dto.CoachSubscriptionDtos.SubscriptionExport;
import com.ascension.service.ai.AiDailyLimitResolver;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
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
     * The plan whose limits apply now. A trial counts until it ends and a canceled plan until the
     * paid period ends; a payment that failed keeps the plan while the provider retries.
     */
    private String effectivePlan(Row row) {
        if (row == null) {
            return properties.getFreePlan();
        }
        Instant now = Instant.now();
        boolean applies = switch (row.status()) {
            case "TRIALING" -> row.trialEndsAt() != null && row.trialEndsAt().isAfter(now);
            case "ACTIVE", "PAST_DUE" -> true;
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
