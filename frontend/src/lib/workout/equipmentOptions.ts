import { MUSCLE_LABEL, type Equipment, type MuscleGroup } from './types';

export interface EquipmentOption {
  id: Equipment;
  label: string;
}

export interface MuscleOption {
  id: MuscleGroup;
  label: string;
}

const RAW_EQUIPMENT_OPTIONS: readonly EquipmentOption[] = [
  { id: 'banda', label: 'Banda Elástica' },
  { id: 'barra', label: 'Barra' },
  { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'mancuernas', label: 'Mancuernas' },
  { id: 'maquina', label: 'Máquina' },
  { id: 'multipower', label: 'Multipower (Smith)' },
  { id: 'peso corporal', label: 'Peso Corporal' },
  { id: 'polea', label: 'Polea' },
];

export const EQUIPMENT_OPTIONS: readonly EquipmentOption[] = [...RAW_EQUIPMENT_OPTIONS].sort(
  (a, b) => a.label.localeCompare(b.label, 'es'),
);

export const MUSCLE_OPTIONS: readonly MuscleOption[] = (
  Object.entries(MUSCLE_LABEL) as [MuscleGroup, string][]
)
  .map(([id, label]) => ({ id, label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'es'));
