package com.ascension.controller;

import com.ascension.dto.CoachDtos.Targets;
import com.ascension.dto.CustomExerciseDTO;
import com.ascension.dto.DashboardDTO;
import com.ascension.dto.FoodLogDTO;
import com.ascension.dto.UserSettingsDTO;
import com.ascension.dto.WeekSummaryDTO;
import com.ascension.dto.WeightEntryDTO;
import com.ascension.dto.WorkoutDTO;
import com.ascension.dto.WorkoutStatsDTO;
import com.ascension.service.CoachAccessPolicy;
import com.ascension.service.CoachAccessPolicy.Action;
import com.ascension.service.CustomExerciseService;
import com.ascension.service.NutritionLogService;
import com.ascension.service.SettingsService;
import com.ascension.service.StepsService;
import com.ascension.service.WeightService;
import com.ascension.service.WorkoutService;
import com.ascension.util.SecurityUtils;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;

/**
 * Read-only view of a client's data for their coach. Every endpoint resolves the client through
 * {@link CoachAccessPolicy#require}, then reuses the client's own read path with the client's email,
 * so a coach never sees more than the client would and never writes anything.
 */
@Validated
@RestController
@RequestMapping("/api/coach/clients/{linkId}")
@RequiredArgsConstructor
public class CoachClientDataController {

    private final CoachAccessPolicy accessPolicy;
    private final WeightService weightService;
    private final StepsService stepsService;
    private final WorkoutService workoutService;
    private final NutritionLogService nutritionLogService;
    private final SettingsService settingsService;
    private final CustomExerciseService customExerciseService;

    @GetMapping("/weights")
    public ResponseEntity<List<WeightEntryDTO>> weights(@PathVariable UUID linkId, @AuthenticationPrincipal Jwt jwt) {
        return read(jwt, linkId, Action.VIEW_WEIGHT, weightService::getAllEntries);
    }

    @GetMapping("/weights/dashboard")
    public ResponseEntity<DashboardDTO> weightDashboard(@PathVariable UUID linkId, @AuthenticationPrincipal Jwt jwt) {
        return read(jwt, linkId, Action.VIEW_WEIGHT, weightService::getDashboard);
    }

    @GetMapping("/weights/weekly")
    public ResponseEntity<List<WeekSummaryDTO>> weightWeekly(@PathVariable UUID linkId, @AuthenticationPrincipal Jwt jwt) {
        return read(jwt, linkId, Action.VIEW_WEIGHT, weightService::getWeeklySummaries);
    }

    @GetMapping("/steps/weekly")
    public ResponseEntity<List<WeekSummaryDTO>> stepsWeekly(@PathVariable UUID linkId, @AuthenticationPrincipal Jwt jwt) {
        return read(jwt, linkId, Action.VIEW_STEPS, stepsService::getWeeklySummaries);
    }

    @GetMapping("/workouts")
    public ResponseEntity<Page<WorkoutDTO>> workouts(
            @PathVariable UUID linkId,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "La página debe ser mayor o igual a 0") int page,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "El tamaño de página debe ser al menos 1") @Max(value = 100, message = "El tamaño de página no puede exceder 100") int size,
            @AuthenticationPrincipal Jwt jwt) {
        return read(jwt, linkId, Action.VIEW_WORKOUTS, email -> workoutService.getWorkoutHistory(email, page, size));
    }

    @GetMapping("/workouts/stats")
    public ResponseEntity<WorkoutStatsDTO> workoutStats(@PathVariable UUID linkId, @AuthenticationPrincipal Jwt jwt) {
        return read(jwt, linkId, Action.VIEW_WORKOUTS, workoutService::getStats);
    }

    @GetMapping("/workouts/recent")
    public ResponseEntity<List<WorkoutDTO>> recentWorkouts(
            @PathVariable UUID linkId,
            @RequestParam @Min(value = 0, message = "El parámetro 'since' no puede ser negativo") Long since,
            @AuthenticationPrincipal Jwt jwt) {
        return read(jwt, linkId, Action.VIEW_WORKOUTS, email -> workoutService.getRecentWorkouts(email, since));
    }

    /** The client's own exercises, so the coach sees their names in workouts and charts. */
    @GetMapping("/workouts/custom-exercises")
    public ResponseEntity<List<CustomExerciseDTO>> customExercises(@PathVariable UUID linkId,
                                                                   @AuthenticationPrincipal Jwt jwt) {
        return read(jwt, linkId, Action.VIEW_WORKOUTS, email -> customExerciseService.getCustomExercises(email)
                .stream()
                .map(ex -> CustomExerciseDTO.builder().id(ex.getId()).name(ex.getName())
                        .muscle(ex.getMuscle()).equipment(ex.getEquipment()).build())
                .toList());
    }

    @GetMapping("/workouts/{workoutId}")
    public ResponseEntity<WorkoutDTO> workout(@PathVariable UUID linkId, @PathVariable String workoutId,
                                              @AuthenticationPrincipal Jwt jwt) {
        return read(jwt, linkId, Action.VIEW_WORKOUTS, email -> workoutService.getWorkoutDetail(email, workoutId));
    }

    @GetMapping("/nutrition/logs")
    public ResponseEntity<List<FoodLogDTO>> foodLogs(
            @PathVariable UUID linkId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal Jwt jwt) {
        return read(jwt, linkId, Action.VIEW_NUTRITION, email -> nutritionLogService.getFoodLogsByDate(email, date));
    }

    @GetMapping("/nutrition/calories/weekly")
    public ResponseEntity<List<WeekSummaryDTO>> caloriesWeekly(@PathVariable UUID linkId, @AuthenticationPrincipal Jwt jwt) {
        return read(jwt, linkId, Action.VIEW_NUTRITION, nutritionLogService::getWeeklyCalories);
    }

    @GetMapping("/targets")
    public ResponseEntity<Targets> targets(@PathVariable UUID linkId, @AuthenticationPrincipal Jwt jwt) {
        return read(jwt, linkId, Action.VIEW_TARGETS, email -> toTargets(settingsService.getSettings(email)));
    }

    private <T> ResponseEntity<T> read(Jwt jwt, UUID linkId, Action action, Function<String, T> loader) {
        String coachEmail = SecurityUtils.extractEmail(jwt);
        if (coachEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        String clientEmail = accessPolicy.require(coachEmail, linkId, action).clientEmail();
        return ResponseEntity.ok(loader.apply(clientEmail));
    }

    private static Targets toTargets(UserSettingsDTO settings) {
        if (settings == null) {
            return new Targets(null, null, null, null, null, null, null, null);
        }
        return new Targets(settings.getKcal(), settings.getMacroStrategy(),
                settings.getCustomProteinPct(), settings.getCustomFatPct(), settings.getCustomCarbsPct(),
                settings.getCustomProteinGrams(), settings.getCustomFatGrams(), settings.getCustomCarbsGrams());
    }
}
