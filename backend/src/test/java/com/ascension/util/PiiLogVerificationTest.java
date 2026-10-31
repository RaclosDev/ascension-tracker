package com.ascension.util;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.ascension.dto.UserDataExportDTO;
import com.ascension.model.RestoreMode;
import com.ascension.repository.*;
import com.ascension.service.AccountDeletionService;
import com.ascension.service.UserDataExportService;
import com.ascension.service.UserDataQuotaService;
import com.ascension.service.UserDataRestoreService;
import com.ascension.service.WorkoutMapper;
import com.ascension.service.ai.GeminiQuotaService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PiiLogVerificationTest {

    private static final String TARGET_EMAIL = "athlete.secret@example.com";
    private static final Pattern EMAIL_PATTERN = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");

    private ListAppender<ILoggingEvent> listAppender;
    private Logger rootLogger;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private WorkoutRepository workoutRepository;

    @Mock
    private CustomExerciseRepository customExerciseRepository;

    @Mock
    private WorkoutTemplateRepository workoutTemplateRepository;

    @Mock
    private FoodLogRepository foodLogRepository;

    @Mock
    private MealRepository mealRepository;

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private SavedFoodRepository savedFoodRepository;

    @Mock
    private StepsEntryRepository stepsEntryRepository;

    @Mock
    private WeightEntryRepository weightEntryRepository;

    @Mock
    private UserSettingsRepository userSettingsRepository;

    @Mock
    private UserDataQuotaService userDataQuotaService;

    @BeforeEach
    void setupLogAppender() {
        rootLogger = (Logger) LoggerFactory.getLogger("com.ascension");
        listAppender = new ListAppender<>();
        listAppender.start();
        rootLogger.addAppender(listAppender);
    }

    @AfterEach
    void tearDownLogAppender() {
        if (rootLogger != null && listAppender != null) {
            rootLogger.detachAppender(listAppender);
        }
    }

    @Test
    void accountDeletionService_masksEmailInAllLogs() {
        AccountDeletionService service = new AccountDeletionService(jdbcTemplate);
        service.wipeAccountData(TARGET_EMAIL);

        assertNoRawEmailInLogs();
        assertContainsMaskedEmailInLogs(TARGET_EMAIL);
    }

    @Test
    void userDataExportService_masksEmailInLogs() {
        WorkoutMapper mapper = Mappers.getMapper(WorkoutMapper.class);
        UserDataExportService service = new UserDataExportService(
                workoutRepository,
                customExerciseRepository,
                workoutTemplateRepository,
                foodLogRepository,
                mealRepository,
                recipeRepository,
                savedFoodRepository,
                stepsEntryRepository,
                weightEntryRepository,
                userSettingsRepository,
                mapper
        );

        when(workoutRepository.findAllByUserEmailOrderByStartedAtDesc(TARGET_EMAIL)).thenReturn(Collections.emptyList());
        when(customExerciseRepository.findByUserEmail(TARGET_EMAIL)).thenReturn(Collections.emptyList());
        when(workoutTemplateRepository.findByUserEmail(TARGET_EMAIL)).thenReturn(Collections.emptyList());
        when(foodLogRepository.findAllByUserEmailOrderByDateAscIdAsc(TARGET_EMAIL)).thenReturn(Collections.emptyList());
        when(mealRepository.findAllByUserEmailOrderBySortOrderAsc(TARGET_EMAIL)).thenReturn(Collections.emptyList());
        when(recipeRepository.findAllByUserEmailOrderByNameAsc(TARGET_EMAIL)).thenReturn(Collections.emptyList());
        when(savedFoodRepository.findAllByUserEmailOrderByNameAsc(TARGET_EMAIL)).thenReturn(Collections.emptyList());
        when(stepsEntryRepository.findAllByUserEmailOrderByDateAsc(TARGET_EMAIL)).thenReturn(Collections.emptyList());
        when(weightEntryRepository.findAllByUserEmailOrderByDateAsc(TARGET_EMAIL)).thenReturn(Collections.emptyList());

        service.exportUserData(TARGET_EMAIL);

        assertNoRawEmailInLogs();
        assertContainsMaskedEmailInLogs(TARGET_EMAIL);
    }

    @Test
    void userDataRestoreService_masksEmailInLogs() {
        UserDataRestoreService service = new UserDataRestoreService(
                jdbcTemplate,
                workoutRepository,
                customExerciseRepository,
                workoutTemplateRepository,
                foodLogRepository,
                mealRepository,
                recipeRepository,
                savedFoodRepository,
                stepsEntryRepository,
                weightEntryRepository,
                userSettingsRepository,
                userDataQuotaService
        );

        UserDataExportDTO backup = UserDataExportDTO.builder()
                .version("1.0")
                .workouts(Collections.emptyList())
                .customExercises(Collections.emptyList())
                .workoutTemplates(Collections.emptyList())
                .foodLogs(Collections.emptyList())
                .meals(Collections.emptyList())
                .recipes(Collections.emptyList())
                .savedFoods(Collections.emptyList())
                .stepsEntries(Collections.emptyList())
                .weightEntries(Collections.emptyList())
                .userSettings(null)
                .build();

        service.restoreUserData(TARGET_EMAIL, RestoreMode.OVERWRITE, true, backup);

        assertNoRawEmailInLogs();
        assertContainsMaskedEmailInLogs(TARGET_EMAIL);
    }

    @Test
    void geminiQuotaService_masksEmailInLogs() {
        var store = org.mockito.Mockito.mock(com.ascension.service.ai.GeminiQuotaStore.class);
        org.mockito.Mockito.when(store.reserve(TARGET_EMAIL, 0, 500))
                .thenThrow(new com.ascension.exception.AiQuotaExceededException("Quota exceeded"));
        GeminiQuotaService quotaService = new GeminiQuotaService(store);
        quotaService.setUserDailyLimit(0); // Force quota trip

        try {
            quotaService.checkQuotaAndCircuit(TARGET_EMAIL);
        } catch (Exception ignored) {
        }

        assertNoRawEmailInLogs();
        assertContainsMaskedEmailInLogs(TARGET_EMAIL);
    }

    @Test
    void staticCodeVerification_noRawEmailPassedDirectlyToLogCalls() throws IOException {
        Path sourceDir = Paths.get("src/main/java/com/ascension");
        if (!Files.exists(sourceDir)) {
            sourceDir = Paths.get("backend/src/main/java/com/ascension");
        }
        assertThat(Files.exists(sourceDir)).isTrue();

        Pattern vulnerableLogCall = Pattern.compile(
                "log\\.(?:info|warn|error|debug|trace)\\([^;]*(?:(?<!maskEmail\\()\\b(?:userEmail|email|normalizedEmail|timer\\.getUserEmail\\(\\)|newRefreshToken\\.getEmail\\(\\)))\\b[^;]*\\)"
        );

        try (Stream<Path> paths = Files.walk(sourceDir)) {
            List<String> violations = paths
                    .filter(Files::isRegularFile)
                    .filter(p -> p.toString().endsWith(".java"))
                    .flatMap(p -> {
                        try {
                            String content = Files.readString(p);
                            Matcher matcher = vulnerableLogCall.matcher(content);
                            if (matcher.find()) {
                                return Stream.of(p.getFileName() + " contains unmasked email log: " + matcher.group().trim());
                            }
                            return Stream.empty();
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    })
                    .toList();

            assertThat(violations).isEmpty();
        }
    }

    private void assertNoRawEmailInLogs() {
        for (ILoggingEvent event : listAppender.list) {
            String formattedMessage = event.getFormattedMessage();
            Matcher matcher = EMAIL_PATTERN.matcher(formattedMessage);
            assertThat(matcher.find())
                    .as("Log statement contains raw unmasked email: " + formattedMessage)
                    .isFalse();
        }
    }

    private void assertContainsMaskedEmailInLogs(String rawEmail) {
        String expectedMasked = PiiMasker.maskEmail(rawEmail);
        boolean found = listAppender.list.stream()
                .anyMatch(event -> event.getFormattedMessage().contains(expectedMasked));

        assertThat(found)
                .as("Expected masked identifier '" + expectedMasked + "' in captured logs")
                .isTrue();
    }
}
