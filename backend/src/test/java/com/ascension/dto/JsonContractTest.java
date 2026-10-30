package com.ascension.dto;

import com.ascension.exception.ApiErrorResponse;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.JsonTest;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pins the JSON the API sends and accepts. The frontend is deployed separately, so a change in
 * the auto-configured mapper (field order, date format, null handling) must show up here. The
 * golden files under {@code src/test/resources/json-contract} were recorded with Spring Boot 3.5
 * (Jackson 2) before the move to Spring Boot 4 (Jackson 3).
 */
@JsonTest
class JsonContractTest {

    private static final LocalDate DATE = LocalDate.of(2024, 1, 5);
    private static final Instant INSTANT = Instant.parse("2024-01-05T10:15:30.123456789Z");

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void weightEntry() throws Exception {
        assertMatchesGolden("weight-entry", WeightEntryDTO.builder().id(7L).date(DATE).weight(81.5).build());
    }

    @Test
    void foodLog() throws Exception {
        assertMatchesGolden("food-log", FoodLogDTO.builder()
                .id(3L).date(DATE).mealIndex(1).product("Yogur").quantity(125).kcal(80.5)
                .protein(10).carbs(5.25).fat(0).portionsJson(null).build());
    }

    @Test
    void emptyDtosKeepNullsAndDefaults() throws Exception {
        Map<String, Object> all = new LinkedHashMap<>();
        all.put("foodLog", new FoodLogDTO());
        all.put("userSettings", new UserSettingsDTO());
        all.put("workout", new WorkoutDTO());
        all.put("workoutStats", new WorkoutStatsDTO());
        all.put("meal", new MealDTO());
        all.put("recipe", new RecipeDTO());
        all.put("savedFood", new SavedFoodDTO());
        all.put("dashboard", new DashboardDTO());
        all.put("macros", new MacrosDTO());
        all.put("weekSummary", new WeekSummaryDTO());
        all.put("workoutPreferences", new WorkoutPreferencesDTO());
        all.put("workoutTemplate", new WorkoutTemplateDTO());
        all.put("workoutImportSummary", new WorkoutImportSummaryDTO());
        all.put("customExercise", new CustomExerciseDTO());
        all.put("userDataExport", new UserDataExportDTO());
        all.put("userDataRestoreSummary", new UserDataRestoreSummaryDTO());
        all.put("apiError", new ApiErrorResponse());
        assertMatchesGolden("empty-dtos", all);
    }

    @Test
    void userSettings() throws Exception {
        assertMatchesGolden("user-settings", UserSettingsDTO.builder()
                .startWeight(90.0).goalWeight(75.0).weeklyGoal(-0.5).startDate(DATE).kcal(2200)
                .macroStrategy("balanced").customProteinPct(30.0).age(35).heightCm(180).sex("M")
                .activityFactor(1.55).workoutData("{\"a\":1}").build());
    }

    @Test
    void dashboard() throws Exception {
        assertMatchesGolden("dashboard", DashboardDTO.builder()
                .currentWeight(80.0).currentWeeklyAverage(80.25).totalLost(10.0).remaining(5.0).progress(66.67)
                .estimatedDate("2024-03-01").avgWeeklyChange(-0.5).weeksActive(12).bestWeekDelta(-1.2)
                .bestWeekDate("2023-11-03").streak(4)
                .streakDays(List.of(new DashboardDTO.StreakDay(DATE, true), new DashboardDTO.StreakDay(DATE.plusDays(1), false)))
                .build());
    }

    @Test
    void weekSummary() throws Exception {
        assertMatchesGolden("week-summary", WeekSummaryDTO.builder()
                .weekStart(DATE).days(java.util.Arrays.asList(80.0, null, 79.5, null, null, 79.0, null))
                .average(79.5).delta(-0.5).entries(3).build());
    }

    @Test
    void workoutWithExercisesAndSets() throws Exception {
        WorkoutSetDTO set = WorkoutSetDTO.builder().id("s1").type("normal").weight("80.5").reps("8")
                .distance(null).duration(null).rpe("8").completed(true).build();
        WorkoutExerciseDTO exercise = WorkoutExerciseDTO.builder().id("e1").exerciseId("bench").notes("ok")
                .supersetId(null).variant(new WorkoutExerciseDTO.VariantDTO("wide", "smith")).sets(List.of(set)).build();
        assertMatchesGolden("workout", WorkoutDTO.builder().id("w1").name("Push").startedAt(1704450000000L)
                .finishedAt(1704453600000L).notes(null).exercises(List.of(exercise)).build());
    }

    @Test
    void workoutPreferences() throws Exception {
        Map<String, Integer> restTimers = new LinkedHashMap<>();
        restTimers.put("bench", 120);
        restTimers.put("squat", 180);
        assertMatchesGolden("workout-preferences", WorkoutPreferencesDTO.builder()
                .globalMachines(List.of("smith")).globalGrips(List.of("wide")).exerciseAliases(Map.of("bench", "Banca"))
                .exerciseVariants(Map.of("bench", new WorkoutPreferencesDTO.ExerciseVariantDTO(List.of("wide"), List.of("smith"))))
                .hiddenEquipments(List.of()).exerciseGifs(Map.of()).restTimers(restTimers).restPreset(90).build());
    }

    @Test
    void mealAndSavedFoodAndRecipe() throws Exception {
        Map<String, Object> all = new LinkedHashMap<>();
        all.put("meal", MealDTO.builder().id(1L).name("Desayuno").icon("sun").proteinPct(25.0).sortOrder(0)
                .startTime("07:00").endTime("10:00").isDefault(true).build());
        all.put("savedFood", SavedFoodDTO.builder().id(2L).name("Yogur").brand("Marca").kcalPer100g(60)
                .proteinPer100g(8).carbsPer100g(4).fatPer100g(1.5).servingSize(125.0).servingLabel("envase").build());
        all.put("recipe", RecipeDTO.builder().id(3L).name("Tortilla").description(null).totalKcal(500)
                .totalProtein(30).totalCarbs(20).totalFat(30).build());
        all.put("macros", MacrosDTO.builder().kcal(2200).protein(165.0).carbs(220.0).fat(73.3).build());
        all.put("steps", StepsEntryDTO.builder().id(4L).date(DATE).steps(10000).build());
        all.put("stats", WorkoutStatsDTO.builder().totalWorkouts(10).totalDurationSeconds(36000).totalVolume(12345.5).totalSets(200).build());
        assertMatchesGolden("nutrition-misc", all);
    }

    @Test
    void instantsAndErrors() throws Exception {
        Map<String, Object> all = new LinkedHashMap<>();
        all.put("restoreSummary", UserDataRestoreSummaryDTO.builder().mode("MERGE").workoutsRestored(2)
                .settingsRestored(true).restoredAt(INSTANT).build());
        all.put("export", UserDataExportDTO.builder().exportedAt(Instant.parse("2024-01-05T10:15:30Z"))
                .userEmail("user@example.com").workouts(List.of()).weightEntries(List.of(
                        WeightEntryDTO.builder().id(1L).date(DATE).weight(80.0).build())).build());
        all.put("error", new ApiErrorResponse("Not found", "abc-123", Instant.parse("2024-01-05T10:15:30.120Z")));
        assertMatchesGolden("instants-and-errors", all);
    }

    @Test
    void readsRequestBodiesTheFrontendSends() throws Exception {
        // Explicit null for a primitive, an unknown field and an ISO date: all accepted today.
        FoodLogDTO food = objectMapper.readValue("""
                {"date":"2024-01-05","mealIndex":1,"product":"Pan","quantity":null,"kcal":250,"unknown":"x"}
                """, FoodLogDTO.class);
        assertThat(food.getQuantity()).isZero();
        assertThat(food.getKcal()).isEqualTo(250.0);
        assertThat(food.getDate()).isEqualTo(DATE);

        UserDataExportDTO export = objectMapper.readValue("""
                {"version":"1.0","exportedAt":"2024-01-05T10:15:30Z","workouts":[],"stepsEntries":null}
                """, UserDataExportDTO.class);
        assertThat(export.getExportedAt()).isEqualTo(Instant.parse("2024-01-05T10:15:30Z"));

        WorkoutStatsDTO stats = objectMapper.readValue("{\"totalWorkouts\":null,\"totalVolume\":1.5}", WorkoutStatsDTO.class);
        assertThat(stats.getTotalWorkouts()).isZero();
        assertThat(stats.getTotalVolume()).isEqualTo(1.5);

        // AI replies are trimmed to the outer brackets but may still carry text after the JSON.
        assertThat(objectMapper.readTree("[{\"product\":\"Pan\"}] fin").get(0).get("product").asString()).isEqualTo("Pan");
    }

    private void assertMatchesGolden(String name, Object value) throws IOException {
        String actual = objectMapper.writeValueAsString(value);
        assertThat(actual).isEqualTo(readGolden(name));
    }

    private static String readGolden(String name) throws IOException {
        String path = "/json-contract/" + name + ".json";
        try (InputStream in = JsonContractTest.class.getResourceAsStream(path)) {
            assertThat(in).as("golden file %s", path).isNotNull();
            return new String(in.readAllBytes(), StandardCharsets.UTF_8).strip();
        }
    }
}
