package com.ascension.service;

import com.ascension.exception.EntityNotFoundException;
import com.ascension.exception.InvalidInputException;
import com.ascension.repository.CustomExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ExerciseMergeService {
    private final CustomExerciseRepository exercises;
    private final UserDataQuotaService quotas;
    private final JdbcTemplate jdbc;
    private final PowerliftingService powerlifting;

    public record Result(int workoutExercisesUpdated, int templateExercisesUpdated, boolean sourceDeleted) { }

    /** Custom exercises get a server-generated UUID; catalog ids (ex-0001, base-...) are not UUIDs. */
    private static boolean looksLikeCustomId(String id) {
        try {
            java.util.UUID.fromString(id);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    @Transactional
    public Result merge(String email, String source, String target) {
        if (source == null || source.isBlank() || target == null || target.isBlank() || source.equals(target)) {
            throw new InvalidInputException("Selecciona dos ejercicios distintos");
        }
        quotas.acquireUserQuotaLock(email);
        var sourceCustom = exercises.findById(source);
        var targetCustom = exercises.findById(target);
        if (sourceCustom.filter(ex -> !email.equals(ex.getUserEmail())).isPresent()
                || targetCustom.filter(ex -> !email.equals(ex.getUserEmail())).isPresent()) {
            throw new EntityNotFoundException("Ejercicio no encontrado");
        }
        // The backend has no catalog, but a UUID can only be a custom exercise: it must exist (and be ours).
        if (targetCustom.isEmpty() && looksLikeCustomId(target)) {
            throw new EntityNotFoundException("Ejercicio no encontrado");
        }
        int workouts = jdbc.update("UPDATE workout_exercises SET exercise_id = ? WHERE exercise_id = ? " +
                "AND workout_id IN (SELECT id FROM workouts WHERE user_email = ?)", target, source, email);
        int templates = jdbc.update("UPDATE workout_template_exercises SET exercise_id = ? WHERE exercise_id = ? " +
                "AND template_id IN (SELECT id FROM workout_templates WHERE user_email = ?)", target, source, email);
        // Programs the user owns and the powerlifting mappings of their athletes also point at the exercise.
        String targetName = targetCustom.map(ex -> ex.getName()).orElse(null);
        jdbc.update("UPDATE program_exercises SET exercise_id = ?, exercise_name = COALESCE(?, exercise_name) " +
                "WHERE exercise_id = ? AND program_day_id IN (SELECT d.id FROM program_days d " +
                "JOIN programs p ON p.id = d.program_id WHERE p.owner_user_id = (SELECT id FROM users WHERE email = ?))",
                target, targetName, source, email);
        powerlifting.renameExercise(email, source, target);
        sourceCustom.ifPresent(exercises::delete);
        return new Result(workouts, templates, sourceCustom.isPresent());
    }
}
