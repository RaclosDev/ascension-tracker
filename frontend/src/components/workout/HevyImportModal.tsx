import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Calendar,
  Dumbbell,
  Layers,
} from 'lucide-react';
import { parseHevyCsv, ParsedHevyImport } from '@/lib/workout/import';
import { useExerciseCatalog } from '@/lib/workout/catalog-query';
import { useImportWorkouts } from '@/lib/workout/api';
import { Exercise } from '@/lib/workout/types';
import { formatDay } from '@/lib/workout/format';

interface HevyImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  customExercises?: Exercise[];
}

export function HevyImportModal({ isOpen, onClose, customExercises = [] }: HevyImportModalProps) {
  const { data: catalog = [] } = useExerciseCatalog();
  const importMutation = useImportWorkouts();

  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedHevyImport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setParsedData(null);
      setFileName(null);
      setError(null);
      return;
    }

    // Autofocus first focusable element on open
    const focusables = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusables && focusables.length > 0) {
      focusables[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !importMutation.isPending) {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const currentFocusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!currentFocusables || currentFocusables.length === 0) return;

        const first = currentFocusables[0];
        const last = currentFocusables[currentFocusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, importMutation.isPending, onClose]);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Por favor, selecciona un archivo con extensión .csv');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo supera el límite de 10 MB.');
      return;
    }

    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const result = parseHevyCsv(text, catalog, customExercises);
        if (result.workouts.length === 0) {
          setError('No se detectaron entrenamientos válidos en el archivo.');
          setParsedData(null);
          return;
        }
        setParsedData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al procesar el archivo CSV.');
        setParsedData(null);
      }
    };
    reader.onerror = () => {
      setError('Error al leer el archivo en el navegador.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;
    try {
      await importMutation.mutateAsync({
        customExercises: parsedData.newCustomExercises,
        workouts: parsedData.workouts,
      });
      onClose();
    } catch {
      // Error handled by mutation toast
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hevy-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !importMutation.isPending) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: 'var(--bg-card, #18181b)',
          border: '1px solid var(--border-medium, #27272a)',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          color: 'var(--text-main, #f4f4f5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 id="hevy-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Importar desde Hevy
            </h2>
            <p
              style={{
                margin: '0.25rem 0 0',
                fontSize: '0.875rem',
                color: 'var(--text-muted, #a1a1aa)',
              }}
            >
              Sube tu histórico de entrenamientos exportado en CSV.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={importMutation.isPending}
            aria-label="Cerrar modal de importación"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #a1a1aa)',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Dropzone */}
        {!parsedData && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? 'var(--primary, #3b82f6)' : 'var(--border-medium, #3f3f46)'}`,
              borderRadius: '0.75rem',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isDragging
                ? 'rgba(59, 130, 246, 0.05)'
                : 'rgba(255, 255, 255, 0.02)',
              transition: 'border-color 0.2s ease, background-color 0.2s ease',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
            />
            <div
              style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 1rem',
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: 'var(--primary, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UploadCloud size={28} />
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
              Arrastra tu archivo CSV aquí o haz clic para buscar
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #a1a1aa)' }}>
              Compatible con exportaciones oficiales de Hevy (hasta 10 MB)
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {parsedData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                color: 'var(--text-muted, #a1a1aa)',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '0.5rem',
              }}
            >
              <FileSpreadsheet size={16} />
              <span style={{ fontWeight: 500, color: 'var(--text-main, #f4f4f5)' }}>
                {fileName}
              </span>
              <button
                onClick={() => {
                  setParsedData(null);
                  setFileName(null);
                }}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary, #3b82f6)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                Cambiar archivo
              </button>
            </div>

            {/* Metrics Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-medium, #27272a)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: 'var(--text-muted, #a1a1aa)',
                    fontSize: '0.75rem',
                  }}
                >
                  <Dumbbell size={14} /> Entrenamientos
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem' }}>
                  {parsedData.workouts.length}
                </div>
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-medium, #27272a)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: 'var(--text-muted, #a1a1aa)',
                    fontSize: '0.75rem',
                  }}
                >
                  <Layers size={14} /> Series registradas
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem' }}>
                  {parsedData.totalSets}
                </div>
              </div>
            </div>

            {parsedData.firstDate && parsedData.lastDate && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted, #a1a1aa)',
                }}
              >
                <Calendar size={16} />
                <span>
                  Período: <strong>{formatDay(parsedData.firstDate)}</strong> al{' '}
                  <strong>{formatDay(parsedData.lastDate)}</strong>
                </span>
              </div>
            )}

            {parsedData.newCustomExercises.length > 0 ? (
              <div
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--primary, #3b82f6)',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <CheckCircle2 size={16} />
                  {parsedData.newCustomExercises.length} ejercicios nuevos a registrar en tu
                  catálogo
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.4rem',
                    maxHeight: '100px',
                    overflowY: 'auto',
                  }}
                >
                  {parsedData.newCustomExercises.map((ex) => (
                    <span
                      key={ex.id}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.5rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '0.25rem',
                        color: 'var(--text-main, #f4f4f5)',
                      }}
                    >
                      {ex.name} ({ex.muscle} · {ex.equipment})
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted, #a1a1aa)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <CheckCircle2 size={14} color="#10b981" />
                Todos los ejercicios coinciden con tu catálogo existente.
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '0.5rem',
          }}
        >
          <button
            onClick={onClose}
            disabled={importMutation.isPending}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-medium, #3f3f46)',
              background: 'transparent',
              color: 'var(--text-main, #f4f4f5)',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: importMutation.isPending ? 'not-allowed' : 'pointer',
            }}
          >
            Cancelar
          </button>

          {parsedData && (
            <button
              onClick={handleConfirmImport}
              disabled={importMutation.isPending}
              aria-label={`Confirmar e importar ${parsedData.workouts.length} entrenamientos`}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: 'var(--primary, #3b82f6)',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: importMutation.isPending ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Importando...
                </>
              ) : (
                `Confirmar e Importar (${parsedData.workouts.length})`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
