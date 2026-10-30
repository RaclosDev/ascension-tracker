package com.ascension.service;

import com.ascension.dto.*;
import com.ascension.model.WeightEntry;
import com.ascension.repository.WeightEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WeightService {

    private final WeightEntryRepository weightEntryRepository;
    private final SettingsService settingsService;
    private final UserDataQuotaService userDataQuotaService;

    // CRUD operations

    public List<WeightEntryDTO> getAllEntries(String userEmail) {
        return weightEntryRepository.findAllByUserEmailOrderByDateAsc(userEmail).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public WeightEntryDTO saveEntry(String userEmail, WeightEntryDTO dto) {
        userDataQuotaService.acquireUserQuotaLock(userEmail);
        WeightEntry entry = weightEntryRepository.findByUserEmailAndDate(userEmail, dto.getDate())
                .orElse(null);
        if (entry == null) {
            userDataQuotaService.checkWeightEntryQuota(userEmail, 1);
            entry = new WeightEntry();
        }
        entry.setUserEmail(userEmail);
        entry.setDate(dto.getDate());
        entry.setWeight(dto.getWeight());
        return toDTO(weightEntryRepository.save(entry));
    }

    @Transactional
    public void deleteEntry(String userEmail, LocalDate date) {
        weightEntryRepository.findByUserEmailAndDate(userEmail, date).ifPresent(weightEntryRepository::delete);
    }

    // Dashboard

    public DashboardDTO getDashboard(String userEmail) {
        UserSettingsDTO settings = settingsService.getSettings(userEmail);
        if (settings == null) {
            settings = UserSettingsDTO.builder()
                    .kcal(2000)
                    .macroStrategy("BALANCED")
                    .startWeight(80.0)
                    .goalWeight(75.0)
                    .weeklyGoal(0.5)
                    .build();
        }
        List<WeightEntry> allEntries = weightEntryRepository.findAllByUserEmailOrderByDateAsc(userEmail);

        Double startWeight = settings.getStartWeight() != null ? settings.getStartWeight() : 80.0;
        Double goalWeight = settings.getGoalWeight() != null ? settings.getGoalWeight() : 75.0;

        if (allEntries.isEmpty()) {
            return DashboardDTO.builder()
                    .currentWeight(startWeight)
                    .currentWeeklyAverage(startWeight)
                    .totalLost(0.0)
                    .remaining(startWeight - goalWeight)
                    .progress(0.0)
                    .estimatedDate("--")
                    .avgWeeklyChange(0.0)
                    .weeksActive(0)
                    .bestWeekDelta(0.0)
                    .bestWeekDate("--")
                    .streak(0)
                    .streakDays(getStreakDays(allEntries))
                    .build();
        }

        // Group entries by week (Monday-based)
        List<WeekData> weeks = groupByWeeks(allEntries);

        // Current weight = absolute last logged weight
        Double currentWeight = allEntries.get(allEntries.size() - 1).getWeight();
        // Current weekly average = average of last week with data
        Double currentWeeklyAverage = getCurrentWeight(weeks);
        
        Double totalLost = currentWeight - startWeight;
        Double remaining = currentWeight - goalWeight;
        double totalToLose = startWeight - goalWeight;
        Double progress = 0.0;
        if (Math.abs(totalToLose) > 0.0001) {
            progress = Math.min(100.0, Math.max(0.0,
                    ((startWeight - currentWeight) / totalToLose) * 100.0));
        }

        Double avgWeeklyChange = getAvgWeeklyChange(weeks);

        String estimatedDate = calculateEstimatedDate(currentWeight, goalWeight, avgWeeklyChange, settings.getWeeklyGoal());

        // Best week = largest drop in weekly average.
        double bestDelta = 0;
        String bestWeekDate = "--";
        for (int i = 1; i < weeks.size(); i++) {
            double delta = weeks.get(i).average - weeks.get(i - 1).average;
            if (delta < bestDelta) {
                bestDelta = delta;
                bestWeekDate = weeks.get(i).mondayDate.format(DateTimeFormatter.ofPattern("d MMM", Locale.forLanguageTag("es-ES")));
            }
        }

        int streak = calculateStreak(allEntries);

        return DashboardDTO.builder()
                .currentWeight(round2(currentWeight))
                .currentWeeklyAverage(round2(currentWeeklyAverage))
                .totalLost(round2(totalLost))
                .remaining(round2(remaining))
                .progress(round1(progress))
                .estimatedDate(estimatedDate)
                .avgWeeklyChange(round3(avgWeeklyChange))
                .weeksActive(weeks.size())
                .bestWeekDelta(round2(bestDelta))
                .bestWeekDate(bestWeekDate)
                .streak(streak)
                .streakDays(getStreakDays(allEntries))
                .build();
    }

    // Weekly summaries

    public List<WeekSummaryDTO> getWeeklySummaries(String userEmail) {
        List<WeightEntry> allEntries = weightEntryRepository.findAllByUserEmailOrderByDateAsc(userEmail);
        if (allEntries.isEmpty()) return List.of();

        LocalDate firstMonday = allEntries.get(0).getDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate currentMonday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        Map<LocalDate, Double> entryMap = allEntries.stream()
                .collect(Collectors.toMap(WeightEntry::getDate, WeightEntry::getWeight, (v1, v2) -> v2));

        List<WeekSummaryDTO> summaries = new ArrayList<>();
        Double previousAvg = null;

        LocalDate monday = firstMonday;
        while (!monday.isAfter(currentMonday)) {
            List<Double> days = new ArrayList<>();
            List<Double> validValues = new ArrayList<>();

            for (int d = 0; d < 7; d++) {
                LocalDate day = monday.plusDays(d);
                Double weight = entryMap.get(day);
                days.add(weight);
                if (weight != null) validValues.add(weight);
            }

            Double average = validValues.isEmpty() ? null :
                    validValues.stream().mapToDouble(Double::doubleValue).average().getAsDouble();

            Double delta = null;
            if (average != null && previousAvg != null) {
                delta = round2(average - previousAvg);
            }

            summaries.add(WeekSummaryDTO.builder()
                    .weekStart(monday)
                    .days(days)
                    .average(average != null ? round2(average) : null)
                    .delta(delta)
                    .entries(validValues.size())
                    .build());

            if (average != null) previousAvg = average;
            monday = monday.plusWeeks(1);
        }

        return summaries;
    }

    // Internal helpers

    private List<WeekData> groupByWeeks(List<WeightEntry> entries) {
        Map<LocalDate, List<WeightEntry>> weekMap = new LinkedHashMap<>();
        for (WeightEntry e : entries) {
            LocalDate monday = e.getDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            weekMap.computeIfAbsent(monday, k -> new ArrayList<>()).add(e);
        }

        return weekMap.entrySet().stream()
                .map(e -> {
                    double avg = e.getValue().stream().mapToDouble(WeightEntry::getWeight).average().orElse(0);
                    return new WeekData(e.getKey(), avg, e.getValue().size());
                })
                .collect(Collectors.toList());
    }

    private Double getCurrentWeight(List<WeekData> weeks) {
        if (weeks.isEmpty()) return 0.0;
        return weeks.get(weeks.size() - 1).average;
    }

    private Double getAvgWeeklyChange(List<WeekData> weeks) {
        if (weeks.size() < 2) return 0.0;
        double totalChange = weeks.get(weeks.size() - 1).average - weeks.get(0).average;
        return totalChange / (weeks.size() - 1);
    }

    private String calculateEstimatedDate(Double current, Double goal, Double avgWeekly, Double weeklyGoal) {
        if (current == null || goal == null) return "--";
        double remaining = current - goal;
        if (remaining <= 0) return LocalDate.now().format(DateTimeFormatter.ofPattern("d 'de' MMMM 'de' yyyy", Locale.forLanguageTag("es-ES")));
        double weeklyLoss = Math.abs(avgWeekly != null ? avgWeekly : 0.0);
        double effectiveWeeklyGoal = (weeklyGoal != null && weeklyGoal > 0) ? weeklyGoal : 0.5;
        if (weeklyLoss < 0.01) {
            long days = Math.round((remaining / effectiveWeeklyGoal) * 7);
            return LocalDate.now().plusDays(days).format(DateTimeFormatter.ofPattern("d 'de' MMMM 'de' yyyy", Locale.forLanguageTag("es-ES")));
        }
        long days = Math.round((remaining / weeklyLoss) * 7);
        return LocalDate.now().plusDays(days).format(DateTimeFormatter.ofPattern("d 'de' MMMM 'de' yyyy", Locale.forLanguageTag("es-ES")));
    }

    private int calculateStreak(List<WeightEntry> entries) {
        Set<LocalDate> dateSet = entries.stream().map(WeightEntry::getDate).collect(Collectors.toSet());
        int streak = 0;
        LocalDate check = LocalDate.now();

        // If today has no entry, start from yesterday
        if (!dateSet.contains(check)) {
            check = check.minusDays(1);
        }

        while (dateSet.contains(check)) {
            streak++;
            check = check.minusDays(1);
        }
        return streak;
    }

    private List<DashboardDTO.StreakDay> getStreakDays(List<WeightEntry> entries) {
        Set<LocalDate> dateSet = entries.stream().map(WeightEntry::getDate).collect(Collectors.toSet());
        List<DashboardDTO.StreakDay> days = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int i = 13; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            days.add(DashboardDTO.StreakDay.builder().date(d).hasData(dateSet.contains(d)).build());
        }
        return days;
    }

    private WeightEntryDTO toDTO(WeightEntry entry) {
        return WeightEntryDTO.builder()
                .id(entry.getId())
                .date(entry.getDate())
                .weight(entry.getWeight())
                .build();
    }

    private double round1(double v) { return Math.round(v * 10.0) / 10.0; }
    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }
    private double round3(double v) { return Math.round(v * 1000.0) / 1000.0; }

    private record WeekData(LocalDate mondayDate, double average, int entries) {}
}
