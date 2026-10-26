import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MuscleRecovery } from '../components/workout/muscle-recovery';
import type { CompletedWorkout, Exercise } from '../lib/workout/types';

describe('MuscleRecovery Component', () => {
  const customExercises: Exercise[] = [
    { id: 'bench_press', name: 'Press Banca', muscle: 'pecho', equipment: 'barra' },
    { id: 'overhead_press', name: 'Press Militar', muscle: 'hombros', equipment: 'barra' },
    { id: 'biceps_curl', name: 'Curl Bíceps', muscle: 'biceps', equipment: 'mancuernas' },
    { id: 'triceps_ext', name: 'Extensión Tríceps', muscle: 'triceps', equipment: 'polea' },
    { id: 'lat_pulldown', name: 'Jalón al Pecho', muscle: 'dorsales', equipment: 'polea' },
    { id: 'squat', name: 'Sentadilla', muscle: 'cuadriceps', equipment: 'barra' },
    {
      id: 'romanian_deadlift',
      name: 'Peso Muerto Rumano',
      muscle: 'femorales',
      equipment: 'barra',
    },
    { id: 'hip_thrust', name: 'Hip Thrust', muscle: 'gluteos', equipment: 'barra' },
    {
      id: 'lateral_raise',
      name: 'Elevaciones Laterales',
      muscle: 'hombros',
      equipment: 'mancuernas',
    },
    { id: 'cable_row', name: 'Remo Gironda', muscle: 'espalda_alta', equipment: 'polea' },
    { id: 'calf_raise', name: 'Elevación de Gemelos', muscle: 'gemelos', equipment: 'maquina' },
  ];

  it('renders 100% Listo when history has no fatigue within 72h', () => {
    render(<MuscleRecovery history={[]} customExercises={customExercises} />);

    expect(screen.getByText('Recuperación')).toBeDefined();
    expect(screen.getByText('100% Listo')).toBeDefined();
    expect(screen.getByText('Músculos recuperados')).toBeDefined();
  });

  it('renders fatigued muscles in a clean column and displays up to 5 muscles', () => {
    const recentTime = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
    const mockWorkout: CompletedWorkout = {
      id: 'w1',
      name: 'Full Body Intenso',
      startedAt: recentTime - 3600000,
      finishedAt: recentTime,
      exercises: [
        {
          id: 'e1',
          exerciseId: 'bench_press',
          notes: '',
          sets: [
            { id: 's1', type: 'normal', reps: '10', weight: '80', completed: true },
            { id: 's2', type: 'normal', reps: '10', weight: '80', completed: true },
          ],
        },
        {
          id: 'e2',
          exerciseId: 'overhead_press',
          notes: '',
          sets: [{ id: 's3', type: 'normal', reps: '10', weight: '50', completed: true }],
        },
        {
          id: 'e3',
          exerciseId: 'triceps_ext',
          notes: '',
          sets: [{ id: 's4', type: 'normal', reps: '12', weight: '30', completed: true }],
        },
        {
          id: 'e4',
          exerciseId: 'biceps_curl',
          notes: '',
          sets: [{ id: 's5', type: 'normal', reps: '12', weight: '15', completed: true }],
        },
        {
          id: 'e5',
          exerciseId: 'lat_pulldown',
          notes: '',
          sets: [{ id: 's6', type: 'normal', reps: '10', weight: '70', completed: true }],
        },
        {
          id: 'e6',
          exerciseId: 'squat',
          notes: '',
          sets: [{ id: 's7', type: 'normal', reps: '8', weight: '100', completed: true }],
        },
        {
          id: 'e7',
          exerciseId: 'romanian_deadlift',
          notes: '',
          sets: [{ id: 's8', type: 'normal', reps: '10', weight: '90', completed: true }],
        },
        {
          id: 'e8',
          exerciseId: 'hip_thrust',
          notes: '',
          sets: [{ id: 's9', type: 'normal', reps: '10', weight: '120', completed: true }],
        },
        {
          id: 'e9',
          exerciseId: 'cable_row',
          notes: '',
          sets: [{ id: 's10', type: 'normal', reps: '10', weight: '60', completed: true }],
        },
        {
          id: 'e10',
          exerciseId: 'calf_raise',
          notes: '',
          sets: [{ id: 's11', type: 'normal', reps: '15', weight: '50', completed: true }],
        },
      ],
    };

    render(<MuscleRecovery history={[mockWorkout]} customExercises={customExercises} />);

    // Pecho should be visible
    expect(screen.getByText('Pecho')).toBeDefined();
    // Since 10 muscles fatigued, 8 are on the card and "+2 más · Ver todos" is displayed
    expect(screen.getByText(/más · Ver todos/i)).toBeDefined();
  });

  it('opens detailed recovery dialog when clicking view details button', () => {
    const recentTime = Date.now() - 3600000;
    const mockWorkout: CompletedWorkout = {
      id: 'w1',
      name: 'Torso',
      startedAt: recentTime - 3600000,
      finishedAt: recentTime,
      exercises: [
        {
          id: 'e1',
          exerciseId: 'bench_press',
          notes: '',
          sets: [{ id: 's1', type: 'normal', reps: '10', weight: '80', completed: true }],
        },
      ],
    };

    render(<MuscleRecovery history={[mockWorkout]} customExercises={customExercises} />);

    const openBtn = screen.getByText('Ver detalle');
    fireEvent.click(openBtn);

    expect(screen.getByText('Ventana 72h')).toBeDefined();
    expect(screen.getByText(/Estimación del nivel de recuperación/i)).toBeDefined();
  });
});
