import React, { RefObject, ChangeEvent } from 'react';
import { Mic, ImageIcon, X, Loader2 } from 'lucide-react';

export interface AiFoodAssistantViewProps {
  query: string;
  setQuery: (val: string) => void;
  selectedImage: string | ArrayBuffer | null;
  setSelectedImage: (val: string | ArrayBuffer | null) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  isListening: boolean;
  toggleListening: (text: string) => void;
  stopListening: () => void;
  aiSubmitting: boolean;
  aiElapsedSeconds: number;
  getAiStatusText: (sec: number) => string;
  onCancel: () => void;
  onSubmit: () => void;
}

export const AiFoodAssistantView: React.FC<AiFoodAssistantViewProps> = ({
  query,
  setQuery,
  selectedImage,
  setSelectedImage,
  fileInputRef,
  handleImageChange,
  isListening,
  toggleListening,
  stopListening,
  aiSubmitting,
  aiElapsedSeconds,
  getAiStatusText,
  onCancel,
  onSubmit,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="form-group" style={{ position: 'relative' }}>
        <textarea
          className="form-input"
          rows={4}
          placeholder="Ej: 'Me he comido una hamburguesa con queso y patatas fritas' o '150g de pechuga de pollo y 200g de arroz'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ resize: 'none', paddingBottom: '3rem' }}
          autoFocus
        />

        {/* IMAGE PREVIEW */}
        {selectedImage && (
          <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', zIndex: 3 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={selectedImage as string}
                alt="Preview"
                style={{
                  height: '40px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-medium)',
                  objectFit: 'cover',
                }}
              />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  cursor: 'pointer',
                }}
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            bottom: '0.6rem',
            right: '0.6rem',
            display: 'flex',
            gap: '0.4rem',
            zIndex: 2,
          }}
        >
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'all 0.2s ease',
            }}
            title="Adjuntar foto"
          >
            <ImageIcon size={16} />
          </button>
          <button
            type="button"
            className={isListening ? 'recording-pulse-btn' : ''}
            onClick={() => toggleListening(query)}
            style={{
              background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-secondary)',
              border: isListening ? '1px solid #ef4444' : '1px solid var(--border-color)',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isListening ? '#ef4444' : 'var(--text-primary)',
              transition: 'all 0.2s ease',
            }}
          >
            <Mic size={16} color={isListening ? '#ef4444' : undefined} />
          </button>
        </div>
      </div>

      {isListening && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
            color: '#ef4444',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            padding: '0.45rem 0.8rem',
            borderRadius: '8px',
            marginTop: '-0.35rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="recording-dot" />
            <span>
              <strong>Escuchando...</strong> Habla con calma a tu ritmo.
            </span>
          </div>
          <button
            type="button"
            onClick={stopListening}
            style={{
              background: '#ef4444',
              border: 'none',
              color: '#fff',
              borderRadius: '6px',
              padding: '0.2rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Listo
          </button>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginTop: '0.5rem',
        }}
      >
        {aiSubmitting && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              padding: '0.65rem 0.9rem',
              borderRadius: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Loader2 size={16} className="animate-spin" style={{ color: '#8b5cf6' }} />
                <span style={{ fontWeight: 600 }}>{getAiStatusText(aiElapsedSeconds)}</span>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  background: 'rgba(139, 92, 246, 0.15)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {aiElapsedSeconds}s
              </span>
            </div>
            {aiElapsedSeconds >= 6 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Analizando ingredientes complejos y calculando macros con IA...
              </span>
            )}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={onCancel} disabled={aiSubmitting}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={onSubmit}
            disabled={aiSubmitting || (!query.trim() && !selectedImage)}
            style={{
              background: 'var(--gradient-protein-carbs, linear-gradient(90deg, #8b5cf6, #3b82f6))',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {aiSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Analizando ({aiElapsedSeconds}s)...</span>
              </>
            ) : (
              'Analizar y Añadir'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default AiFoodAssistantView;
