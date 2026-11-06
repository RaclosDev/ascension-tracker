package com.ascension.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.ascension.dto.WorkoutPreferencesDTO;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.exception.ExternalApiException;
import com.ascension.repository.UserSettingsRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import tools.jackson.databind.json.JsonMapper;

/** Failures that used to surface as a 500 and now reach the client with the right status. */
class ExceptionMappingTest {

    private final JsonMapper json = JsonMapper.builder().build();

    @Test
    void missingWorkoutSettingsIsANotFoundWithoutTheEmail() {
        UserSettingsRepository repository = mock(UserSettingsRepository.class);
        when(repository.findByUserEmail("ana@example.com")).thenReturn(Optional.empty());
        WorkoutPreferencesService service = new WorkoutPreferencesService(repository, json);

        assertThatThrownBy(() -> service.updatePreferences("ana@example.com", new WorkoutPreferencesDTO()))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageNotContaining("ana@example.com");
    }

    @Test
    void fatSecretErrorPayloadIsABadGateway() throws Exception {
        FatSecretResponseMapper mapper = new FatSecretResponseMapper(json);

        assertThatThrownBy(() -> mapper.mapFatSecretToOpenFoodFacts(
                json.readTree("{\"error\":{\"message\":\"Invalid IP\"}}"), false))
                .isInstanceOfSatisfying(ExternalApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.BAD_GATEWAY));
    }
}
