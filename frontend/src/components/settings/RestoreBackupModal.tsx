import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  Dumbbell,
  Utensils,
  Scale,
  Footprints,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { restoreUserData, UserDataRestoreSummary } from '@/api/client';

interface RestoreBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BackupPreview {
  version?: string;
  exportedAt?: string;
  userEmail?: string;
  workoutsCount: number;
  customExercisesCount: number;
  workoutTemplatesCount: number;
  foodLogsCount: number;
  recipesCount: number;
  weightEntriesCount: number;
  stepsEntriesCount: number;
  hasSettings: boolean;
  rawPayload: unknown;
}

export function RestoreBackupModal({ isOpen, onClose }: RestoreBackupModalProps) {
  const queryClient = useQueryClient();

  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'OVERWRITE' | 'MERGE'>('OVERWRITE');
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setPreview(null);
      setFileName(null);
      setError(null);
      setConfirmOverwrite(false);
      setIsLoading(false);
      return;
    }

    const focusables = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusables && focusables.length > 0) {
      focusables[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const currentFocusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (currentFocusables.length === 0) return;
        const first = currentFocusables[0];
        const last = currentFocusables[currentFocusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  const processFile = (file: File) => {
    setError(null);
    setFileName(file.name);

    if (!file.name.endsWith('.json')) {
      setError('Por favor selecciona un archivo con extensión .json');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);

        if (!json || typeof json !== 'object') {
          setError('El archivo no contiene un objeto JSON válido');
          return;
        }

        if (json.version !== '1.0') {
          setError('Versión de copia de seguridad no compatible (se requiere versión 1.0)');
          return;
        }

        setPreview({
          version: json.version,
          exportedAt: json.exportedAt,
          userEmail: json.userEmail,
          workoutsCount: Array.isArray(json.workouts) ? json.workouts.length : 0,
          customExercisesCount: Array.isArray(json.customExercises)
            ? json.customExercises.length
            : 0,
          workoutTemplatesCount: Array.isArray(json.workoutTemplates)
            ? json.workoutTemplates.length
            : 0,
          foodLogsCount: Array.isArray(json.foodLogs) ? json.foodLogs.length : 0,
          recipesCount: Array.isArray(json.recipes) ? json.recipes.length : 0,
          weightEntriesCount: Array.isArray(json.weightEntries) ? json.weightEntries.length : 0,
          stepsEntriesCount: Array.isArray(json.stepsEntries) ? json.stepsEntries.length : 0,
          hasSettings: Boolean(json.userSettings),
          rawPayload: json,
        });
      } catch {
        setError('Error al leer el archivo. Asegúrate de que no esté dañado.');
      }
    };

    reader.onerror = () => {
      setError('Error al leer el archivo desde el disco.');
    };

    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleConfirmRestore = async () => {
    if (!preview || !preview.rawPayload) return;

    if (restoreMode === 'OVERWRITE' && !confirmOverwrite) {
      setError('Debes confirmar que comprendes que los datos actuales serán reemplazados.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const isBackupEmpty =
      preview.workoutsCount === 0 &&
      preview.customExercisesCount === 0 &&
      preview.workoutTemplatesCount === 0 &&
      preview.foodLogsCount === 0 &&
      preview.recipesCount === 0 &&
      preview.weightEntriesCount === 0 &&
      preview.stepsEntriesCount === 0 &&
      !preview.hasSettings;

    try {
      const summary: UserDataRestoreSummary = await restoreUserData(
        preview.rawPayload,
        restoreMode,
        restoreMode === 'OVERWRITE' && isBackupEmpty && confirmOverwrite,
      );
      toast.success(
        `Copia de seguridad restaurada (${summary.mode}): ${summary.workoutsRestored} entrenamientos, ${summary.foodLogsRestored} registros de comida`,
      );

      // Invalidate all React Query caches so all pages refresh with restored data
      await queryClient.invalidateQueries();

      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Error al restaurar la copia de seguridad. Comprueba la conexión o el archivo.';
      setError(errorMsg);
      toast.error('Fallo en la restauración');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restore-modal-title"
    >
      <div
        ref={modalRef}
        className="card w-full max-w-xl max-h-[90vh] flex flex-col p-6 overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-neutral-900"
        style={{ background: 'var(--color-bg-surface, #171717)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <UploadCloud
              className="w-5 h-5 text-primary"
              style={{ color: 'var(--color-primary)' }}
            />
            <h2 id="restore-modal-title" className="text-lg font-bold text-white">
              Restaurar Copia de Seguridad (JSON)
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Cerrar modal de restauración"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {!preview ? (
            <div>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-primary bg-primary/10'
                    : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                }`}
                style={{
                  borderColor: isDragging ? 'var(--color-primary)' : undefined,
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileInputChange}
                  aria-label="Seleccionar archivo de copia de seguridad JSON"
                />
                <FileText className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
                <p className="font-semibold text-white mb-1">
                  Arrastra tu archivo JSON de copia de seguridad aquí
                </p>
                <p className="text-sm text-neutral-400 mb-3">
                  o haz clic para explorar tus archivos
                </p>
                <span className="inline-block px-3 py-1 text-xs rounded-full bg-white/5 text-neutral-300 border border-white/10">
                  Formato compatible: ascension-backup-*.json (GDPR 1.0)
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{fileName}</p>
                    <p className="text-xs text-neutral-400">
                      Copia creada:{' '}
                      {preview.exportedAt
                        ? new Date(preview.exportedAt).toLocaleDateString()
                        : 'Desconocida'}{' '}
                      · Versión {preview.version}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setFileName(null);
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="text-xs text-neutral-400 hover:text-white underline"
                >
                  Cambiar archivo
                </button>
              </div>

              {/* Data Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <Dumbbell
                    className="w-4 h-4 mx-auto mb-1 text-primary"
                    style={{ color: 'var(--color-primary)' }}
                  />
                  <p className="text-base font-bold text-white">{preview.workoutsCount}</p>
                  <p className="text-xs text-neutral-400">Entrenos</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <Utensils
                    className="w-4 h-4 mx-auto mb-1 text-primary"
                    style={{ color: 'var(--color-primary)' }}
                  />
                  <p className="text-base font-bold text-white">{preview.foodLogsCount}</p>
                  <p className="text-xs text-neutral-400">Comidas</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <Scale
                    className="w-4 h-4 mx-auto mb-1 text-primary"
                    style={{ color: 'var(--color-primary)' }}
                  />
                  <p className="text-base font-bold text-white">{preview.weightEntriesCount}</p>
                  <p className="text-xs text-neutral-400">Pesos</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <Footprints
                    className="w-4 h-4 mx-auto mb-1 text-primary"
                    style={{ color: 'var(--color-primary)' }}
                  />
                  <p className="text-base font-bold text-white">{preview.stepsEntriesCount}</p>
                  <p className="text-xs text-neutral-400">Pasos</p>
                </div>
              </div>

              {/* Additional Entities Details */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-neutral-300 space-y-1">
                <div className="flex justify-between">
                  <span>Ejercicios personalizados:</span>
                  <span className="font-semibold text-white">{preview.customExercisesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Plantillas de entreno:</span>
                  <span className="font-semibold text-white">{preview.workoutTemplatesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Recetas guardadas:</span>
                  <span className="font-semibold text-white">{preview.recipesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ajustes y métricas corporales:</span>
                  <span className="font-semibold text-white">
                    {preview.hasSettings ? 'Incluidos' : 'No disponibles'}
                  </span>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <p className="text-sm font-semibold text-white">Método de Restauración:</p>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors border-white/10 hover:border-white/30 bg-black/20">
                    <input
                      type="radio"
                      name="restoreMode"
                      value="OVERWRITE"
                      checked={restoreMode === 'OVERWRITE'}
                      onChange={() => setRestoreMode('OVERWRITE')}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">
                        Sobrescribir datos (Reemplazo completo)
                      </p>
                      <p className="text-xs text-neutral-400">
                        Elimina tus datos actuales y deja la cuenta exactamente en el estado de la
                        copia de seguridad.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors border-white/10 hover:border-white/30 bg-black/20">
                    <input
                      type="radio"
                      name="restoreMode"
                      value="MERGE"
                      checked={restoreMode === 'MERGE'}
                      onChange={() => setRestoreMode('MERGE')}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">
                        Fusionar datos (Conservar actuales)
                      </p>
                      <p className="text-xs text-neutral-400">
                        Conserva tus datos actuales y añade los registros de la copia que no existan
                        previamente.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Overwrite Confirmation Checkbox */}
                {restoreMode === 'OVERWRITE' && (
                  <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-200 mt-2 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-red-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Advertencia de reemplazo
                    </div>
                    <p>
                      Esta acción reemplazará de forma atómica tus entrenamientos, comidas y
                      registros actuales.
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-white pt-1">
                      <input
                        type="checkbox"
                        checked={confirmOverwrite}
                        onChange={(e) => setConfirmOverwrite(e.target.checked)}
                        className="rounded"
                      />
                      Entiendo y deseo sobrescribir los datos actuales
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn btn-secondary px-4 py-2"
          >
            Cancelar
          </button>
          {preview && (
            <button
              type="button"
              onClick={handleConfirmRestore}
              disabled={isLoading || (restoreMode === 'OVERWRITE' && !confirmOverwrite)}
              aria-busy={isLoading}
              aria-label={
                isLoading
                  ? 'Restaurando copia de seguridad en curso'
                  : 'Confirmar restauración de copia'
              }
              className="btn btn-primary px-5 py-2 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Restaurando datos...</span>
                </>
              ) : (
                <span>Confirmar Restauración</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
