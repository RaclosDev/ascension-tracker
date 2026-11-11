package com.ascension.service;

import com.ascension.dto.CoachSettingsDtos.Settings;
import com.ascension.dto.CoachSetupDtos.Services;
import com.ascension.dto.CoachScheduleDtos.Schedule;
import com.ascension.util.Emails;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
public class CoachSettingsService {
    private final JdbcTemplate jdbc;
    private final CoachService coaches;

    public CoachSettingsService(JdbcTemplate jdbc, CoachService coaches) {
        this.jdbc = jdbc;
        this.coaches = coaches;
    }

    public Settings get(String email) {
        coaches.requireCoachId(email);
        return exportFor(email);
    }

    public Settings exportFor(String email) {
        List<Settings> rows = jdbc.query("""
                SELECT p.*, LEFT(COALESCE(p.professional_name, NULLIF(u.name, ''), u.email), 80) AS display_name
                FROM coach_profiles p JOIN users u ON u.id = p.user_id WHERE u.email = ?
                """, (rs, n) -> new Settings(rs.getString("display_name"), rs.getString("presentation"),
                rs.getBoolean("show_account_photo"), new Services(rs.getBoolean("default_training"),
                rs.getBoolean("default_nutrition"), rs.getBoolean("default_progress")),
                rs.getBoolean("default_prefill"), new Schedule(rs.getInt("default_review_day"),
                rs.getObject("default_review_time", LocalTime.class), rs.getString("default_review_zone"), false),
                rs.getInt("settings_version")), Emails.normalizeRequired(email));
        return rows.isEmpty() ? null : rows.getFirst();
    }

    @Transactional
    public Settings save(String email, Settings request) {
        UUID owner = coaches.requireCoachId(email);
        int updated = jdbc.update("""
                UPDATE coach_profiles SET professional_name = ?, presentation = ?, show_account_photo = ?,
                    default_training = ?, default_nutrition = ?, default_progress = ?, default_prefill = ?,
                    default_review_day = ?, default_review_time = ?, default_review_zone = ?,
                    settings_version = settings_version + 1
                WHERE user_id = ? AND settings_version = ?
                """, request.displayName().strip(), request.presentation().strip(), request.showAccountPhoto(),
                request.services().training(), request.services().nutrition(), request.services().progress(),
                request.prefill(), request.review().day(), request.review().time(), request.review().timeZone(),
                owner, request.version());
        if (updated == 0) {
            throw new OptimisticLockingFailureException("Los ajustes han cambiado en otra sesión. Recarga la versión guardada antes de continuar.");
        }
        return exportFor(email);
    }
}
