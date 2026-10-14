package com.ascension.service;

import com.ascension.dto.CustomExerciseDTO;
import com.ascension.model.CustomExercise;
import com.ascension.repository.CustomExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomExerciseService {

    private final CustomExerciseRepository customExerciseRepository;

    @Transactional(readOnly = true)
    public List<CustomExerciseDTO> getCustomExercises(String userEmail) {
        return customExerciseRepository.findByUserEmail(userEmail).stream()
                .map(this::toCustomExerciseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CustomExerciseDTO saveCustomExercise(String userEmail, CustomExerciseDTO dto) {
        CustomExercise ex = CustomExercise.builder()
                .id(UUID.randomUUID().toString())
                .name(dto.getName())
                .muscle(dto.getMuscle())
                .equipment(dto.getEquipment())
                .userEmail(userEmail)
                .build();
        ex = customExerciseRepository.save(ex);
        return toCustomExerciseDTO(ex);
    }

    @Transactional
    public CustomExerciseDTO updateCustomExercise(String userEmail, String id, CustomExerciseDTO dto) {
        CustomExercise ex = customExerciseRepository.findByUserEmailAndId(userEmail, id)
                .orElseThrow(() -> new com.ascension.exception.EntityNotFoundException("Custom exercise not found with id: " + id));
        ex.setName(dto.getName());
        ex.setMuscle(dto.getMuscle());
        ex.setEquipment(dto.getEquipment());
        ex = customExerciseRepository.save(ex);
        return toCustomExerciseDTO(ex);
    }

    @Transactional
    public void deleteCustomExercise(String userEmail, String id) {
        customExerciseRepository.deleteByUserEmailAndId(userEmail, id);
    }

    private CustomExerciseDTO toCustomExerciseDTO(CustomExercise ex) {
        return CustomExerciseDTO.builder()
                .id(ex.getId())
                .name(ex.getName())
                .muscle(ex.getMuscle())
                .equipment(ex.getEquipment())
                .userEmail(ex.getUserEmail())
                .build();
    }
}
