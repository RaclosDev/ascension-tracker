import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContentFullScreen,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { EQUIPMENT_OPTIONS, MUSCLE_OPTIONS } from '@/lib/workout/equipmentOptions';
import type { Equipment, Exercise, MuscleGroup } from '@/lib/workout/types';

export interface CreateExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    muscle: MuscleGroup;
    equipment: Equipment;
    gifUrl?: string;
  }) => void;
  initialData?: Exercise | null;
  initialName?: string;
  hiddenEquipments?: string[];
  isSubmitting?: boolean;
}

export function CreateExerciseModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  initialName,
  hiddenEquipments = [],
  isSubmitting = false,
}: CreateExerciseModalProps) {
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup>('pecho');
  const [equipment, setEquipment] = useState<Equipment>('barra');
  const [image, setImage] = useState<string | undefined>(undefined);

  const imageGeneration = useRef(0);
  const imageReader = useRef<FileReader | null>(null);
  const cancelImage = () => {
    imageGeneration.current += 1;
    const reader = imageReader.current;
    imageReader.current = null;
    if (reader?.readyState === 1) reader.abort();
  };
  useLayoutEffect(() => cancelImage, [isOpen, initialData, initialName]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setMuscle(initialData.muscle);
        setEquipment(initialData.equipment);
        setImage(initialData.gifUrl);
      } else {
        setName(initialName || '');
        setMuscle('pecho');
        setEquipment('barra');
        setImage(undefined);
      }
    }
  }, [isOpen, initialData, initialName]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    cancelImage();
    const generation = imageGeneration.current;
    const reader = new FileReader();
    imageReader.current = reader;
    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (generation !== imageGeneration.current) return;
      const img = new Image();
      img.onload = () => {
        if (generation !== imageGeneration.current) return;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setImage(dataUrl);
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      muscle,
      equipment,
      gifUrl: image,
    });
  }

  const isEditMode = !!initialData;
  const availableEquipment = EQUIPMENT_OPTIONS.filter((eq) => !hiddenEquipments.includes(eq.id));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContentFullScreen
        style={{
          padding:
            'calc(env(safe-area-inset-top, 44px) + 1.5rem) 1.5rem calc(env(safe-area-inset-bottom, 20px) + 1.5rem) 1.5rem',
          background: 'var(--bg-primary)',
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {isEditMode ? 'Editar Ejercicio Personalizado' : 'Crear Ejercicio / Variante'}
          </DialogTitle>
          <DialogDescription style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {isEditMode
              ? 'Modifica los datos de tu ejercicio personalizado.'
              : 'Añade un nuevo ejercicio personalizado a tu catálogo.'}
          </DialogDescription>
        </DialogHeader>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginTop: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label
              htmlFor="create-exercise-name"
              style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}
            >
              Nombre
            </label>
            <input
              id="create-exercise-name"
              aria-label="Nombre del ejercicio"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Triceps pushdown (cuerda)"
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label
                htmlFor="create-exercise-muscle"
                style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}
              >
                Músculo
              </label>
              <select
                id="create-exercise-muscle"
                aria-label="Grupo muscular objetivo"
                className="form-input"
                value={muscle}
                onChange={(e) => setMuscle(e.target.value as MuscleGroup)}
              >
                {MUSCLE_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label
                htmlFor="create-exercise-equipment"
                style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}
              >
                Equipamiento
              </label>
              <select
                id="create-exercise-equipment"
                aria-label="Equipamiento necesario"
                className="form-input"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value as Equipment)}
              >
                {availableEquipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginTop: '0.5rem',
            }}
          >
            <label
              htmlFor="create-exercise-photo"
              style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}
            >
              Foto de la Máquina (Opcional)
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'var(--bg-secondary)',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px dashed var(--border-color)',
              }}
            >
              {image ? (
                <img
                  src={image}
                  alt="Preview"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    background: 'var(--bg-primary)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ImageIcon size={20} style={{ color: 'var(--text-secondary)' }} />
                </div>
              )}
              <input
                id="create-exercise-photo"
                aria-label="Subir foto del ejercicio o máquina"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              La imagen se optimizará automáticamente para no ocupar espacio.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            className="btn btn-primary"
            style={{ opacity: name.trim() && !isSubmitting ? 1 : 0.5 }}
          >
            {isEditMode ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </DialogContentFullScreen>
    </Dialog>
  );
}
