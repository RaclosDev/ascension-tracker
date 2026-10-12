package com.ascension.service;

import com.ascension.dto.CustomExerciseDTO;
import com.ascension.model.CustomExercise;
import com.ascension.repository.CustomExerciseRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomExerciseServiceTest {

    @Mock
    private CustomExerciseRepository customExerciseRepository;

    @InjectMocks
    private CustomExerciseService customExerciseService;

    @Test
    void getCustomExercises_returnsMappedList() {
        CustomExercise exercise = CustomExercise.builder()
                .id("ce-1")
                .name("Elevaciones Y")
                .muscle("Hombro lateral")
                .equipment("Mancuernas")
                .userEmail("user@example.com")
                .build();

        when(customExerciseRepository.findByUserEmail("user@example.com"))
                .thenReturn(List.of(exercise));

        List<CustomExerciseDTO> results = customExerciseService.getCustomExercises("user@example.com");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getId()).isEqualTo("ce-1");
        assertThat(results.get(0).getName()).isEqualTo("Elevaciones Y");
        assertThat(results.get(0).getMuscle()).isEqualTo("Hombro lateral");
        assertThat(results.get(0).getEquipment()).isEqualTo("Mancuernas");
        assertThat(results.get(0).getUserEmail()).isEqualTo("user@example.com");
    }

    @Test
    void saveCustomExercise_generatesNewIdAndIgnoresClientId() {
        CustomExerciseDTO dto = CustomExerciseDTO.builder()
                .id("client-id-ex")
                .name("Press Francés Mancuerna")
                .muscle("Tríceps")
                .equipment("Mancuerna")
                .build();

        when(customExerciseRepository.save(any(CustomExercise.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CustomExerciseDTO saved = customExerciseService.saveCustomExercise("user@example.com", dto);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getId()).isNotEqualTo("client-id-ex");
        assertThat(saved.getName()).isEqualTo("Press Francés Mancuerna");
        assertThat(saved.getUserEmail()).isEqualTo("user@example.com");
    }

    @Test
    void deleteCustomExercise_callsRepositoryDelete() {
        customExerciseService.deleteCustomExercise("user@example.com", "ce-1");

        verify(customExerciseRepository).deleteByUserEmailAndId("user@example.com", "ce-1");
    }
}
