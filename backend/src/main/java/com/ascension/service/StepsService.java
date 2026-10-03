package com.ascension.service;

import com.ascension.dto.StepsEntryDTO;
import com.ascension.dto.WeekSummaryDTO;
import com.ascension.model.StepsEntry;
import com.ascension.repository.StepsEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StepsService {

    private final StepsEntryRepository stepsEntryRepository;

    public List<StepsEntryDTO> getAllEntries(String userEmail) {
        return stepsEntryRepository.findAllByUserEmailOrderByDateAsc(userEmail).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public StepsEntryDTO saveEntry(String userEmail, StepsEntryDTO dto) {
        StepsEntry entry = stepsEntryRepository.findByUserEmailAndDate(userEmail, dto.getDate())
                .orElse(new StepsEntry());
        entry.setUserEmail(userEmail);
        entry.setDate(dto.getDate());
        entry.setSteps(dto.getSteps());
        return toDTO(stepsEntryRepository.save(entry));
    }

    @Transactional
    public void deleteEntry(String userEmail, LocalDate date) {
        stepsEntryRepository.findByUserEmailAndDate(userEmail, date).ifPresent(stepsEntryRepository::delete);
    }

    public List<WeekSummaryDTO> getWeeklySummaries(String userEmail) {
        List<StepsEntry> allEntries = stepsEntryRepository.findAllByUserEmailOrderByDateAsc(userEmail);
        if (allEntries.isEmpty()) return List.of();

        LocalDate firstMonday = allEntries.get(0).getDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate currentMonday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        Map<LocalDate, Integer> entryMap = allEntries.stream()
                .collect(Collectors.toMap(StepsEntry::getDate, StepsEntry::getSteps));

        List<WeekSummaryDTO> summaries = new ArrayList<>();
        Double previousAvg = null;

        LocalDate monday = firstMonday;
        while (!monday.isAfter(currentMonday)) {
            List<Double> days = new ArrayList<>();
            List<Integer> validValues = new ArrayList<>();

            for (int d = 0; d < 7; d++) {
                LocalDate day = monday.plusDays(d);
                Integer steps = entryMap.get(day);
                days.add(steps != null ? steps.doubleValue() : null);
                if (steps != null) validValues.add(steps);
            }

            Double average = validValues.isEmpty() ? null :
                    validValues.stream().mapToDouble(Integer::doubleValue).average().getAsDouble();

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

    private StepsEntryDTO toDTO(StepsEntry entry) {
        return StepsEntryDTO.builder()
                .id(entry.getId())
                .date(entry.getDate())
                .steps(entry.getSteps())
                .build();
    }

    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }
}
