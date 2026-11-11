package com.ascension.service;
import com.ascension.dto.LibraryItemDtos.Item;
import com.ascension.exception.InvalidInputException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;
import java.sql.Timestamp;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CoachLibraryService {
    private static final JsonMapper JSON = JsonMapper.builder().build();
    private final JdbcTemplate jdbc;
    private final CoachService coaches;
    private final ProgramService programs;

    @Transactional(readOnly = true)
    public List<Item> list(String email) {
        return list(coaches.requireCoachId(email));
    }

    @Transactional(readOnly = true)
    public List<Item> exportFor(String email) {
        return jdbc.queryForList("SELECT cp.user_id FROM coach_profiles cp JOIN users u ON u.id = cp.user_id WHERE u.email = ?",
                UUID.class, com.ascension.util.Emails.normalize(email)).stream().findFirst().map(this::list).orElse(List.of());
    }

    private List<Item> list(UUID coach) {
        return jdbc.query("SELECT * FROM coach_library_items WHERE coach_user_id = ? ORDER BY last_used DESC NULLS LAST", (rs,n) -> {
            Timestamp used = rs.getTimestamp("last_used");
            return new Item(rs.getString("item_type"), rs.getString("item_id"), rs.getBoolean("favorite"),
                    rs.getString("category"), JSON.readValue(rs.getString("tags"),new TypeReference<List<String>>() {}),
                    rs.getObject("minutes",Integer.class), rs.getString("equipment"),used == null ? null : used.toInstant(),false);
        },coach);
    }

    @Transactional
    public List<Item> save(String email, Item item) {
        UUID coach = coaches.requireCoachId(email);
        jdbc.queryForObject("SELECT user_id FROM coach_profiles WHERE user_id = ? FOR UPDATE",UUID.class,coach);
        if ("PROGRAM".equals(item.type())) {
            try {programs.getLibraryProgram(email, UUID.fromString(item.id()));}
            catch (IllegalArgumentException exception) {throw new InvalidInputException("Identificador de plantilla no válido.");}
        }
        if (jdbc.queryForObject("SELECT COUNT(*) FROM coach_library_items WHERE coach_user_id = ? AND NOT (item_type = ? AND item_id = ?)",
                Integer.class,coach,item.type(),item.id()) >= 1000) throw new InvalidInputException("Has alcanzado el límite de recursos guardados.");
        jdbc.update("""
                INSERT INTO coach_library_items (coach_user_id,item_type,item_id,favorite,category,tags,minutes,equipment,last_used)
                VALUES (?,?,?,?,?,CAST(? AS jsonb),?,?,CASE WHEN ? THEN NOW() END)
                ON CONFLICT (coach_user_id,item_type,item_id) DO UPDATE SET favorite=EXCLUDED.favorite,
                    category=EXCLUDED.category,tags=EXCLUDED.tags,minutes=EXCLUDED.minutes,equipment=EXCLUDED.equipment,
                    last_used=COALESCE(EXCLUDED.last_used,coach_library_items.last_used)
                """,coach,item.type(),item.id(),item.favorite(),item.category(),JSON.writeValueAsString(item.tags()),item.minutes(),item.equipment(),item.used());
        return list(coach);
    }
}
