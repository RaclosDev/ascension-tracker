package com.ascension.service;

import com.ascension.dto.NutritionPlanDtos;
import com.ascension.dto.NutritionPlanDtos.AdherenceDay;
import com.ascension.dto.NutritionPlanDtos.AdherenceWeek;
import com.ascension.dto.NutritionPlanDtos.DayTargets;
import com.ascension.dto.NutritionPlanDtos.Intake;
import com.ascension.service.CoachAccessPolicy.ClientAccess;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * How closely a client follows the nutrition plans one coach set: what they logged each day
 * against the targets in force that day, grouped by week.
 */
@Service
public class NutritionAdherenceService {

    /** A day is on target when kcal land within this share of the target... */
    static final double KCAL_TOLERANCE = 0.10;
    /** ...and protein reaches at least this share of it. */
    static final double MIN_PROTEIN = 0.90;

    private record PlanSpan(LocalDate since, LocalDate until, DayTargets training, DayTargets rest) {
        boolean covers(LocalDate date) {
            return !since.isAfter(date) && (until == null || !until.isBefore(date));
        }
    }

    private final JdbcTemplate jdbcTemplate;
    private final ClientProgramService clientProgramService;

    public NutritionAdherenceService(JdbcTemplate jdbcTemplate, ClientProgramService clientProgramService) {
        this.jdbcTemplate = jdbcTemplate;
        this.clientProgramService = clientProgramService;
    }

    /** The last {@code weeks} weeks, oldest first, the current one up to today. */
    @Transactional(readOnly = true)
    public List<AdherenceWeek> weeks(ClientAccess access, int weeks, LocalDate today) {
        LocalDate from = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).minusWeeks(weeks - 1L);
        List<PlanSpan> plans = plans(access, from, today);
        Map<LocalDate, Intake> intake = intake(access.clientEmail(), from, today);

        List<AdherenceWeek> result = new ArrayList<>();
        for (LocalDate monday = from; !monday.isAfter(today); monday = monday.plusWeeks(1)) {
            List<AdherenceDay> days = new ArrayList<>();
            for (LocalDate date = monday; date.isBefore(monday.plusWeeks(1)) && !date.isAfter(today);
                 date = date.plusDays(1)) {
                days.add(day(access.clientEmail(), date, plans, intake.get(date)));
            }
            result.add(week(monday, days));
        }
        return result;
    }

    private AdherenceDay day(String clientEmail, LocalDate date, List<PlanSpan> plans, Intake logged) {
        // The latest plan that covers the day: on the day a plan is replaced, the new one applies.
        PlanSpan plan = null;
        for (PlanSpan span : plans) {
            if (span.covers(date)) plan = span;
        }
        if (plan == null) return new AdherenceDay(date, null, null, logged, false);
        boolean training = clientProgramService.isTrainingDay(clientEmail, date);
        DayTargets target = training ? plan.training() : plan.rest();
        return new AdherenceDay(date, training ? NutritionPlanDtos.TRAINING : NutritionPlanDtos.REST, target,
                logged, onTarget(target, logged));
    }

    static boolean onTarget(DayTargets target, Intake logged) {
        if (logged == null || target.kcal() == 0) return false;
        boolean kcal = Math.abs(logged.kcal() - target.kcal()) <= target.kcal() * KCAL_TOLERANCE;
        boolean protein = logged.protein() >= target.protein() * MIN_PROTEIN;
        return kcal && protein;
    }

    private static AdherenceWeek week(LocalDate monday, List<AdherenceDay> days) {
        int planned = 0;
        int logged = 0;
        int onTarget = 0;
        double kcal = 0;
        double kcalTarget = 0;
        double protein = 0;
        double proteinTarget = 0;
        for (AdherenceDay day : days) {
            if (day.target() == null) continue;
            planned++;
            if (day.intake() == null) continue;
            logged++;
            if (day.onTarget()) onTarget++;
            kcal += day.intake().kcal();
            kcalTarget += day.target().kcal();
            protein += day.intake().protein();
            proteinTarget += day.target().protein();
        }
        return new AdherenceWeek(monday, planned, logged, onTarget, percent(kcal, kcalTarget),
                percent(protein, proteinTarget), days);
    }

    private static Integer percent(double value, double target) {
        return target <= 0 ? null : (int) Math.round(value * 100 / target);
    }

    /**
     * This coach's plans for this client that overlap the range, oldest first. Without the edit
     * consent the open plan is not in force, so it does not count.
     */
    private List<PlanSpan> plans(ClientAccess access, LocalDate from, LocalDate to) {
        return jdbcTemplate.query("""
                SELECT CAST(created_at AS date) AS since, CAST(ended_at AS date) AS until,
                       training_protein, training_carbs, training_fat, rest_protein, rest_carbs, rest_fat
                FROM nutrition_plans
                WHERE coach_link_id = ? AND client_user_id = ?
                  AND CAST(created_at AS date) <= ? AND (ended_at IS NULL OR CAST(ended_at AS date) >= ?)
                  AND (ended_at IS NOT NULL OR ?)
                ORDER BY created_at
                """, (rs, n) -> new PlanSpan(rs.getObject("since", LocalDate.class),
                        rs.getObject("until", LocalDate.class),
                        DayTargets.of(rs.getInt("training_protein"), rs.getInt("training_carbs"),
                                rs.getInt("training_fat")),
                        DayTargets.of(rs.getInt("rest_protein"), rs.getInt("rest_carbs"), rs.getInt("rest_fat"))),
                access.linkId(), access.clientUserId(), to, from, access.editNutrition());
    }

    private Map<LocalDate, Intake> intake(String clientEmail, LocalDate from, LocalDate to) {
        Map<LocalDate, Intake> byDate = new HashMap<>();
        jdbcTemplate.query("""
                SELECT log_date, SUM(kcal) AS kcal, SUM(protein) AS protein, SUM(carbs) AS carbs, SUM(fat) AS fat
                FROM food_logs WHERE user_email = ? AND log_date BETWEEN ? AND ?
                GROUP BY log_date
                """, rs -> {
            byDate.put(rs.getObject("log_date", LocalDate.class), new Intake((int) Math.round(rs.getDouble("kcal")),
                    round(rs.getDouble("protein")), round(rs.getDouble("carbs")), round(rs.getDouble("fat"))));
        }, clientEmail, from, to);
        return byDate;
    }

    private static double round(double grams) {
        return Math.round(grams * 10) / 10.0;
    }
}
