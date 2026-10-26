package com.ascension.service;

import com.ascension.dto.DashboardDTO;
import com.ascension.dto.UserSettingsDTO;
import com.ascension.dto.WeekSummaryDTO;
import com.ascension.dto.WeightEntryDTO;
import com.ascension.model.WeightEntry;
import com.ascension.repository.WeightEntryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WeightServiceTest {

    @Mock
    private WeightEntryRepository weightEntryRepository;

    @Mock
    private SettingsService settingsService;

    @Mock
    private UserDataQuotaService userDataQuotaService;

    @InjectMocks
    private WeightService weightService;

    private static final String USER_EMAIL = "test@example.com";

    @Test
    @DisplayName("getAllEntries returns mapped DTO list in ascending date order")
    void getAllEntries_returnsMappedList() {
        WeightEntry e1 = WeightEntry.builder()
                .id(1L)
                .userEmail(USER_EMAIL)
                .date(LocalDate.of(2026, 1, 1))
                .weight(80.5)
                .build();
        WeightEntry e2 = WeightEntry.builder()
                .id(2L)
                .userEmail(USER_EMAIL)
                .date(LocalDate.of(2026, 1, 2))
                .weight(80.2)
                .build();

        when(weightEntryRepository.findAllByUserEmailOrderByDateAsc(USER_EMAIL)).thenReturn(List.of(e1, e2));

        List<WeightEntryDTO> result = weightService.getAllEntries(USER_EMAIL);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(1L);
        assertThat(result.get(0).getWeight()).isEqualTo(80.5);
        assertThat(result.get(1).getId()).isEqualTo(2L);
        assertThat(result.get(1).getWeight()).isEqualTo(80.2);
    }

    @Test
    @DisplayName("saveEntry updates existing entry when date matches")
    void saveEntry_updatesExisting() {
        LocalDate date = LocalDate.of(2026, 3, 15);
        WeightEntry existing = WeightEntry.builder()
                .id(10L)
                .userEmail(USER_EMAIL)
                .date(date)
                .weight(82.0)
                .build();

        when(weightEntryRepository.findByUserEmailAndDate(USER_EMAIL, date)).thenReturn(Optional.of(existing));
        when(weightEntryRepository.save(any(WeightEntry.class))).thenAnswer(inv -> inv.getArgument(0));

        WeightEntryDTO dto = WeightEntryDTO.builder().date(date).weight(81.5).build();
        WeightEntryDTO saved = weightService.saveEntry(USER_EMAIL, dto);

        assertThat(saved.getId()).isEqualTo(10L);
        assertThat(saved.getWeight()).isEqualTo(81.5);
        verify(weightEntryRepository).save(existing);
    }

    @Test
    @DisplayName("saveEntry creates new entry when date does not exist")
    void saveEntry_createsNew() {
        LocalDate date = LocalDate.of(2026, 3, 16);
        when(weightEntryRepository.findByUserEmailAndDate(USER_EMAIL, date)).thenReturn(Optional.empty());
        when(weightEntryRepository.save(any(WeightEntry.class))).thenAnswer(inv -> {
            WeightEntry we = inv.getArgument(0);
            we.setId(11L);
            return we;
        });

        WeightEntryDTO dto = WeightEntryDTO.builder().date(date).weight(81.0).build();
        WeightEntryDTO saved = weightService.saveEntry(USER_EMAIL, dto);

        assertThat(saved.getId()).isEqualTo(11L);
        assertThat(saved.getDate()).isEqualTo(date);
        assertThat(saved.getWeight()).isEqualTo(81.0);
    }

    @Test
    @DisplayName("deleteEntry deletes entry if found")
    void deleteEntry_deletesIfPresent() {
        LocalDate date = LocalDate.of(2026, 3, 15);
        WeightEntry entry = WeightEntry.builder().id(5L).userEmail(USER_EMAIL).date(date).build();
        when(weightEntryRepository.findByUserEmailAndDate(USER_EMAIL, date)).thenReturn(Optional.of(entry));

        weightService.deleteEntry(USER_EMAIL, date);

        verify(weightEntryRepository).delete(entry);
    }

    @Test
    @DisplayName("deleteEntry does nothing if entry is absent")
    void deleteEntry_noopIfAbsent() {
        LocalDate date = LocalDate.of(2026, 3, 15);
        when(weightEntryRepository.findByUserEmailAndDate(USER_EMAIL, date)).thenReturn(Optional.empty());

        weightService.deleteEntry(USER_EMAIL, date);

        verify(weightEntryRepository, never()).delete(any());
    }

    @Test
    @DisplayName("getDashboard with empty entries returns default settings values and 0 streak")
    void getDashboard_emptyEntries() {
        UserSettingsDTO settings = UserSettingsDTO.builder()
                .startWeight(85.0)
                .goalWeight(75.0)
                .weeklyGoal(0.5)
                .build();
        when(settingsService.getSettings(USER_EMAIL)).thenReturn(settings);
        when(weightEntryRepository.findAllByUserEmailOrderByDateAsc(USER_EMAIL)).thenReturn(List.of());

        DashboardDTO dashboard = weightService.getDashboard(USER_EMAIL);

        assertThat(dashboard.getCurrentWeight()).isEqualTo(85.0);
        assertThat(dashboard.getCurrentWeeklyAverage()).isEqualTo(85.0);
        assertThat(dashboard.getTotalLost()).isEqualTo(0.0);
        assertThat(dashboard.getRemaining()).isEqualTo(10.0);
        assertThat(dashboard.getProgress()).isEqualTo(0.0);
        assertThat(dashboard.getEstimatedDate()).isEqualTo("--");
        assertThat(dashboard.getStreak()).isEqualTo(0);
        assertThat(dashboard.getStreakDays()).hasSize(14);
        assertThat(dashboard.getStreakDays().stream().allMatch(d -> !d.isHasData())).isTrue();
    }

    @Test
    @DisplayName("getDashboard calculates metrics, streak, deltas and estimated date correctly")
    void getDashboard_withEntries() {
        UserSettingsDTO settings = UserSettingsDTO.builder()
                .startWeight(90.0)
                .goalWeight(80.0)
                .weeklyGoal(0.5)
                .build();
        when(settingsService.getSettings(USER_EMAIL)).thenReturn(settings);

        LocalDate today = LocalDate.now();
        List<WeightEntry> entries = new ArrayList<>();
        // Create 2 consecutive weeks of entries
        LocalDate week1Monday = today.minusWeeks(2);
        entries.add(WeightEntry.builder().date(week1Monday).weight(89.0).build());
        entries.add(WeightEntry.builder().date(week1Monday.plusDays(1)).weight(88.8).build());

        LocalDate week2Monday = today.minusWeeks(1);
        entries.add(WeightEntry.builder().date(week2Monday).weight(87.5).build());

        // Current week (yesterday and today for active streak)
        entries.add(WeightEntry.builder().date(today.minusDays(1)).weight(86.2).build());
        entries.add(WeightEntry.builder().date(today).weight(86.0).build());

        when(weightEntryRepository.findAllByUserEmailOrderByDateAsc(USER_EMAIL)).thenReturn(entries);

        DashboardDTO dashboard = weightService.getDashboard(USER_EMAIL);

        assertThat(dashboard.getCurrentWeight()).isEqualTo(86.0);
        assertThat(dashboard.getTotalLost()).isEqualTo(-4.0); // 86.0 - 90.0
        assertThat(dashboard.getRemaining()).isEqualTo(6.0); // 86.0 - 80.0
        assertThat(dashboard.getProgress()).isGreaterThan(0.0);
        assertThat(dashboard.getStreak()).isGreaterThanOrEqualTo(2);
        assertThat(dashboard.getWeeksActive()).isGreaterThanOrEqualTo(2);
        assertThat(dashboard.getEstimatedDate()).isNotEqualTo("--");
        assertThat(dashboard.getStreakDays()).hasSize(14);
    }

    @Test
    @DisplayName("getWeeklySummaries returns grouped summaries with calculated averages and deltas")
    void getWeeklySummaries_calculatesAveragesAndDeltas() {
        LocalDate pastMonday = LocalDate.of(2026, 1, 5);
        LocalDate nextMonday = LocalDate.of(2026, 1, 12);

        WeightEntry e1 = WeightEntry.builder().date(pastMonday).weight(80.0).build();
        WeightEntry e2 = WeightEntry.builder().date(pastMonday.plusDays(1)).weight(80.0).build();
        WeightEntry e3 = WeightEntry.builder().date(nextMonday).weight(79.0).build();

        when(weightEntryRepository.findAllByUserEmailOrderByDateAsc(USER_EMAIL)).thenReturn(List.of(e1, e2, e3));

        List<WeekSummaryDTO> summaries = weightService.getWeeklySummaries(USER_EMAIL);

        assertThat(summaries).isNotEmpty();
        WeekSummaryDTO firstSummary = summaries.get(0);
        assertThat(firstSummary.getEntries()).isEqualTo(2);
        assertThat(firstSummary.getAverage()).isEqualTo(80.0);
    }

    @Test
    @DisplayName("getWeeklySummaries returns empty list when no entries exist")
    void getWeeklySummaries_emptyEntries() {
        when(weightEntryRepository.findAllByUserEmailOrderByDateAsc(USER_EMAIL)).thenReturn(List.of());

        List<WeekSummaryDTO> summaries = weightService.getWeeklySummaries(USER_EMAIL);

        assertThat(summaries).isEmpty();
    }

    @Test
    @DisplayName("getDashboard with null settings uses safe fallback values without NPE")
    void getDashboard_withNullSettings_usesFallbackWithoutNPE() {
        when(settingsService.getSettings(USER_EMAIL)).thenReturn(null);
        when(weightEntryRepository.findAllByUserEmailOrderByDateAsc(USER_EMAIL)).thenReturn(List.of());

        DashboardDTO result = weightService.getDashboard(USER_EMAIL);

        assertThat(result).isNotNull();
        assertThat(result.getCurrentWeight()).isEqualTo(80.0);
        assertThat(result.getProgress()).isEqualTo(0.0);
    }

    @Test
    @DisplayName("getDashboard protects against division by zero when startWeight equals goalWeight")
    void getDashboard_startWeightEqualsGoalWeight_doesNotProduceNaN() {
        UserSettingsDTO settings = UserSettingsDTO.builder()
                .startWeight(80.0)
                .goalWeight(80.0)
                .weeklyGoal(0.0)
                .build();

        when(settingsService.getSettings(USER_EMAIL)).thenReturn(settings);
        when(weightEntryRepository.findAllByUserEmailOrderByDateAsc(USER_EMAIL))
                .thenReturn(List.of(WeightEntry.builder().date(LocalDate.now()).weight(80.0).build()));

        DashboardDTO result = weightService.getDashboard(USER_EMAIL);

        assertThat(Double.isNaN(result.getProgress())).isFalse();
        assertThat(result.getProgress()).isEqualTo(0.0);
    }
}
