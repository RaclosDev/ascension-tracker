package com.ascension.service;

import org.springframework.jdbc.core.JdbcTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Closes what was set up on an account before its owner proved the email address. Someone can sign up
 * with another person's address; when that person takes the account over (Google sign-in or password
 * reset) they must not inherit a coach who can see their data or a browser that receives their
 * notifications.
 */
class AccountTakeover {

    private final JdbcTemplate jdbc;
    private final ProgramSchedule programSchedule;

    AccountTakeover(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        this.programSchedule = new ProgramSchedule(jdbc);
    }

    /** Ends the links, push subscriptions and open invitations of the account; returns the notice, or null if nothing was open. */
    String close(UUID userId, String email) {
        List<UUID> links = jdbc.queryForList("""
                UPDATE coach_clients SET status = 'ENDED', ended_at = NOW()
                WHERE (client_user_id = ? OR coach_user_id = ?) AND status = 'ACTIVE' RETURNING id
                """, UUID.class, userId, userId);
        for (UUID link : links) {
            jdbc.update("""
                    UPDATE nutrition_plans SET status = 'ENDED', ended_at = NOW()
                    WHERE coach_link_id = ? AND status = 'ACTIVE'
                    """, link);
            programSchedule.lock(link);
            jdbc.queryForList("SELECT id FROM program_assignments WHERE coach_link_id = ? AND status = 'ACTIVE'",
                    UUID.class, link).forEach(programSchedule::end);
        }
        int invitations = jdbc.update("""
                UPDATE coach_invitations SET revoked_at = NOW(), client_name = NULL, prefill_sex = NULL,
                    prefill_age = NULL, prefill_height_cm = NULL, prefill_start_weight = NULL,
                    prefill_goal_weight = NULL, prefill_activity_factor = NULL, prefill_app_modules = NULL,
                    coaching_setup = NULL
                WHERE coach_user_id = ? AND accepted_at IS NULL AND revoked_at IS NULL
                """, userId);
        int pushes = jdbc.update("DELETE FROM push_subscriptions WHERE user_email = ?", email);

        List<String> closed = new ArrayList<>();
        if (!links.isEmpty()) {
            closed.add(links.size() == 1 ? "1 vínculo con un entrenador o atleta" : links.size() + " vínculos con entrenadores o atletas");
        }
        if (invitations > 0) {
            closed.add(invitations == 1 ? "1 invitación pendiente" : invitations + " invitaciones pendientes");
        }
        if (pushes > 0) {
            closed.add(pushes == 1 ? "1 dispositivo con notificaciones" : pushes + " dispositivos con notificaciones");
        }
        if (closed.isEmpty()) {
            return null;
        }
        return "Esta cuenta se creó con tu email antes de que lo verificaras tú. Por seguridad hemos cerrado: "
                + String.join(", ", closed) + ". Si los reconoces, puedes volver a crearlos.";
    }
}
