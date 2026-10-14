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

    @Test
    void updateCustomExercise_updatesExistingAndKeepsId() {
        CustomExercise existing = CustomExercise.builder()
                .id("ce-existing")
                .name("Old Name")
                .muscle("Old Muscle")
                .equipment("Old Equipment")
                .userEmail("user@example.com")
                .build();

        CustomExerciseDTO updateDTO = CustomExerciseDTO.builder()
                .name("New Name")
                .muscle("New Muscle")
                .equipment("New Equipment")
                .build();

        when(customExerciseRepository.findByUserEmailAndId("user@example.com", "ce-existing"))
                .thenReturn(java.util.Optional.of(existing));
        when(customExerciseRepository.save(any(CustomExercise.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        CustomExerciseDTO result = customExerciseService.updateCustomExercise("user@example.com", "ce-existing", updateDTO);

        assertThat(result.getId()).isEqualTo("ce-existing");
        assertThat(result.getName()).isEqualTo("New Name");
        assertThat(result.getMuscle()).isEqualTo("New Muscle");
        assertThat(result.getEquipment()).isEqualTo("New Equipment");
    }

    @Test
    void updateCustomExercise_notFound_throwsEntityNotFoundException() {
        when(customExerciseRepository.findByUserEmailAndId("user@example.com", "ce-999"))
                .thenReturn(java.util.Optional.empty());

        CustomExerciseDTO updateDTO = CustomExerciseDTO.builder().name("X").build();

        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                customExerciseService.updateCustomExercise("user@example.com", "ce-999", updateDTO))
                .isInstanceOf(com.ascension.exception.EntityNotFoundException.class);
    }
}
