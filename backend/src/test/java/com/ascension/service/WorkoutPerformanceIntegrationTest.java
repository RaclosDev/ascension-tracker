package com.ascension.service;

import com.ascension.TestcontainersConfiguration;
import com.ascension.dto.WorkoutDTO;
import com.ascension.dto.WorkoutExerciseDTO;
import com.ascension.dto.WorkoutSetDTO;
import com.ascension.dto.WorkoutStatsDTO;
import com.ascension.repository.WorkoutRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
@TestPropertySource(properties = {
    "GOOGLE_CLIENT_ID=test-google-client-id",
    "GEMINI_API_KEY=test-gemini-key"
})
class WorkoutPerformanceIntegrationTest {

    @Autowired
    private WorkoutService workoutService;

    @Autowired
    private WorkoutRepository workoutRepository;

    @Autowired
    private UserService userService;

    @Test
    @Transactional
    @DisplayName("WorkoutRepository paginates in database without in-memory collection pagination")
    void paginationRunsInDatabaseWithoutInMemoryFetch() {
        String email = "perf-athlete@example.com";
        userService.ensureUserExists(email, "Perf Athlete", null);

        for (int i = 0; i < 5; i++) {
            WorkoutDTO workout = WorkoutDTO.builder()
                    .name("Workout " + i)
                    .startedAt(1700000000000L + (i * 3600000L))
                    .finishedAt(1700000000000L + (i * 3600000L) + 1800000L)
                    .exercises(List.of(
                            WorkoutExerciseDTO.builder()
                                    .exerciseId("bench-press")
                                    .sets(List.of(
                                            WorkoutSetDTO.builder().type("normal").weight("80.5").reps("10").completed(true).build(),
                                            WorkoutSetDTO.builder().type("normal").weight("85").reps("8").completed(true).build()
                                    ))
                                    .build()
                    ))
                    .build();
            workoutService.saveWorkout(email, workout);
        }

        // Paginate page 0, size 2
        Page<WorkoutDTO> page1 = workoutService.getWorkoutHistory(email, 0, 2);
        assertThat(page1.getTotalElements()).isEqualTo(5);
        assertThat(page1.getContent()).hasSize(2);
        assertThat(page1.getContent().get(0).getExercises()).hasSize(1);
        assertThat(page1.getContent().get(0).getExercises().get(0).getSets()).hasSize(2);

        // Verify DTO formatting preserves string representation
        WorkoutSetDTO setDto = page1.getContent().get(0).getExercises().get(0).getSets().get(0);
        assertThat(setDto.getWeight()).isEqualTo("80.5");
        assertThat(setDto.getReps()).isEqualTo("10");
    }

    @Test
    @Transactional
    @DisplayName("getWorkoutStats aggregates in SQL directly across workouts and numeric sets")
    void statsAggregatesInSqlDirectly() {
        String email = "stats-athlete@example.com";
        userService.ensureUserExists(email, "Stats Athlete", null);

        WorkoutDTO workout1 = WorkoutDTO.builder()
                .name("Push Day")
                .startedAt(1700000000000L)
                .finishedAt(1700003600000L) // 3600s
                .exercises(List.of(
                        WorkoutExerciseDTO.builder()
                                .exerciseId("bench-press")
                                .sets(List.of(
                                        WorkoutSetDTO.builder().type("normal").weight("100").reps("10").completed(true).build(), // 1000
                                        WorkoutSetDTO.builder().type("normal").weight("80.5").reps("8").completed(true).build()  // 644
                                ))
                                .build()
                ))
                .build();

        WorkoutDTO workout2 = WorkoutDTO.builder()
                .name("Leg Day")
                .startedAt(1700100000000L)
                .finishedAt(1700101800000L) // 1800s
                .exercises(List.of(
                        WorkoutExerciseDTO.builder()
                                .exerciseId("squat")
                                .sets(List.of(
                                        WorkoutSetDTO.builder().type("normal").weight("120").reps("5").completed(true).build()   // 600
                                ))
                                .build()
                ))
                .build();

        workoutService.saveWorkout(email, workout1);
        workoutService.saveWorkout(email, workout2);

        WorkoutStatsDTO stats = workoutService.getStats(email);

        assertThat(stats.getTotalWorkouts()).isEqualTo(2);
        assertThat(stats.getTotalDurationSeconds()).isEqualTo(5400); // 3600 + 1800
        assertThat(stats.getTotalSets()).isEqualTo(3);
        assertThat(stats.getTotalVolume()).isEqualTo(2244.0); // 1000 + 644 + 600
    }
}
