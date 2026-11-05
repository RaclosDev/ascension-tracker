package com.ascension.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Coach plans and their limits. The free plan applies when a trial or paid period has run out;
 * the trial plan is what a new coach gets for {@link #trialDays} days.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "app.coach")
public class CoachPlanProperties {

    private int trialDays = 14;
    private String trialPlan = "PRO";
    private String freePlan = "FREE";
    private Map<String, Plan> plans = new LinkedHashMap<>();
    /** Months charged for a year paid upfront. */
    private int annualMonths = 10;
    private Billing billing = new Billing();

    @Data
    public static class Plan {
        private int maxClients;
        private int aiDailyLimit;
        private int monthlyPriceEur;
    }

    /** Where coaches send the monthly bank transfer while there is no card payment. */
    @Data
    public static class Billing {
        private String transferHolder;
        private String transferIban;
    }

    /** The limits of a plan id, matched case-insensitively; unknown ids fall back to the free plan. */
    public Plan plan(String id) {
        Plan found = find(id);
        if (found != null) {
            return found;
        }
        Plan free = find(freePlan);
        if (free == null) {
            throw new IllegalStateException("app.coach.plans has no free plan '" + freePlan + "'");
        }
        return free;
    }

    /** The configured id matching {@code id} case-insensitively, or null when there is no such plan. */
    public String planId(String id) {
        if (id == null) {
            return null;
        }
        return plans.keySet().stream().filter(key -> key.equalsIgnoreCase(id.trim())).findFirst().orElse(null);
    }

    private Plan find(String id) {
        if (id == null) {
            return null;
        }
        for (Map.Entry<String, Plan> entry : plans.entrySet()) {
            if (entry.getKey().toUpperCase(Locale.ROOT).equals(id.toUpperCase(Locale.ROOT))) {
                return entry.getValue();
            }
        }
        return null;
    }
}
