package com.ascension.service;

import com.ascension.dto.PrescriptionDtos.*;
import com.ascension.dto.ProgramDtos.*;
import com.ascension.exception.InvalidInputException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.databind.json.JsonMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PrescriptionService {
    private final JdbcTemplate jdbc;
    private static final JsonMapper JSON = JsonMapper.builder().build();

    public Program snapshot(Program program, UUID linkId) {
        String profile = jdbc.queryForList("SELECT content::text FROM coach_powerlifting_profiles WHERE link_id = ?",
                String.class, linkId).stream().findFirst().orElse("{}");
        var maxes = JSON.readTree(profile).path("trainingMax");
        List<Day> days = program.days().stream().map(day -> new Day(day.week(), day.dayIndex(), day.name(), day.notes(),
                day.exercises().stream().map(e -> {
                    Prescription p = e.prescription();
                    if (p == null) return e;
                    Prescription resolved = new Prescription(resolve(p.load(), maxes), p.sets() == null ? null : p.sets().stream()
                            .map(s -> new SetTarget(s.kind(), s.reps(), s.rpe(), s.rir(), resolve(s.load(), maxes), s.notes())).toList());
                    return new Exercise(e.exerciseId(), e.exerciseName(), e.variantGrip(), e.variantMachine(), e.sets(),
                            e.repsMin(), e.repsMax(), e.targetRpe(), e.targetRir(), e.restSeconds(), e.loadHint(),
                            e.supersetGroup(), e.notes(), resolved);
                }).toList())).toList();
        return new Program(program.id(), program.name(), program.notes(), program.weeks(), days, program.updatedAt(), program.status());
    }

    private static Load resolve(Load load, tools.jackson.databind.JsonNode maxes) {
        if (load == null) return null;
        if ("KG".equals(load.mode())) return new Load("KG", load.amount(), load.unit(), null, null, null, load.amount(), null);
        if (load.lift() == null || !maxes.path(load.lift()).isNumber() || maxes.path(load.lift()).asDouble() <= 0)
            throw new InvalidInputException("Define el training max de " + (load.lift() == null ? "cada básico" : load.lift()) + " en Powerlifting antes de publicar porcentajes.");
        BigDecimal reference = maxes.path(load.lift()).decimalValue();
        BigDecimal step = load.increment() == null ? new BigDecimal("2.5") : load.increment();
        BigDecimal kg = reference.multiply(load.amount()).divide(new BigDecimal("100"))
                .divide(step, 0, RoundingMode.HALF_UP).multiply(step);
        if (kg.compareTo(new BigDecimal("2000")) > 0) throw new InvalidInputException("La carga calculada supera el límite de 2000 kg. Revisa el TM y el porcentaje.");
        return new Load(load.mode(), load.amount(), load.unit(), load.lift(), step, reference, kg, LocalDate.now());
    }

    static void validate(Exercise e) {
        Prescription p = e.prescription();
        if (p == null) return;
        validateLoad(p.load());
        if (p.sets() == null || p.sets().isEmpty()) return;
        if (p.sets().size() != e.sets()) throw new InvalidInputException("La pauta individual debe tener una fila por serie.");
        for (SetTarget set : p.sets()) {
            if (set.rpe() != null && set.rir() != null) throw new InvalidInputException("Elige RPE o RIR para cada serie.");
            validateLoad(set.load());
        }
    }

    private static void validateLoad(Load load) {
        if (load != null && "PERCENT_TM".equals(load.mode()) && (load.lift() == null || load.amount().compareTo(new BigDecimal("200")) > 0))
            throw new InvalidInputException("El porcentaje de TM necesita un básico y un valor entre 0 y 200.");
    }
}
