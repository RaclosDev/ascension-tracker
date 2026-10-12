import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import {
  Dialog,
  DialogContentFullScreen,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { EXERCISE_CATALOG } from '@/lib/workout/exercises';

export interface ChangeGifModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string | null;
  onSelectGif: (id: string, url: string) => void;
}

export function ChangeGifModal({ isOpen, onClose, exerciseId, onSelectGif }: ChangeGifModalProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const results = EXERCISE_CATALOG.filter(
    (ex) => ex.gifUrl && ex.name.toLowerCase().includes(query.toLowerCase()),
  ).slice(0, 50);

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
            Seleccionar GIF
          </DialogTitle>
          <DialogDescription style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Busca y selecciona un ejercicio del catálogo para usar su GIF.
          </DialogDescription>
        </DialogHeader>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            marginTop: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div className="search-bar" style={{ marginBottom: '1rem' }}>
            <label htmlFor="search-gif-exercise-input" className="sr-only">
              Buscar ejercicio en catálogo para GIF
            </label>
            <Search size={18} className="search-icon" aria-hidden="true" />
            <input
              id="search-gif-exercise-input"
              type="search"
              aria-label="Buscar ejercicio para asociar GIF"
              placeholder="Buscar ejercicio..."
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          {results.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => {
                if (exerciseId && ex.gifUrl) {
                  onSelectGif(exerciseId, ex.gifUrl);
                  onClose();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-medium)',
                borderRadius: '12px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <img
                src={ex.gifUrl}
                alt=""
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                }}
              />
              <div
                style={{
                  flex: 1,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {ex.name}
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
        </div>
      </DialogContentFullScreen>
    </Dialog>
  );
}
