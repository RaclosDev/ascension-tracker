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

    public record Result(int workoutExercisesUpdated, int templateExercisesUpdated, boolean sourceDeleted) { }

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
        int workouts = jdbc.update("UPDATE workout_exercises SET exercise_id = ? WHERE exercise_id = ? " +
                "AND workout_id IN (SELECT id FROM workouts WHERE user_email = ?)", target, source, email);
        int templates = jdbc.update("UPDATE workout_template_exercises SET exercise_id = ? WHERE exercise_id = ? " +
                "AND template_id IN (SELECT id FROM workout_templates WHERE user_email = ?)", target, source, email);
        sourceCustom.ifPresent(exercises::delete);
        return new Result(workouts, templates, sourceCustom.isPresent());
    }
}
