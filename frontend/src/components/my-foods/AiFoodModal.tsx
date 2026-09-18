import React from 'react';

interface AiFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiQuery: string;
  setAiQuery: (query: string) => void;
  isListening: boolean;
  toggleListening: (query: string) => void;
  stopListening: () => void;
  handleAiSubmit: (e: React.FormEvent) => void;
  pendingAiCount: number;
}

export default function AiFoodModal({
  isOpen,
  onClose,
  aiQuery,
  setAiQuery,
  isListening,
  toggleListening,
  stopListening,
  handleAiSubmit,
  pendingAiCount
}: AiFoodModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={() => { stopListening(); onClose(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card fade-in-anim" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>✨ Crear con IA</h3>
          <button onClick={() => { stopListening(); onClose(); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Escribe o dicta el alimento y la IA calculará los macros aproximados. Ej: "Natillas de proteína de Mercadona".
        </p>

        <form onSubmit={(e) => { e.preventDefault(); handleAiSubmit(e); onClose(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              type="button" 
              className={`btn btn-secondary ${isListening ? 'recording-pulse-btn' : ''}`} 
              onClick={() => toggleListening(aiQuery)} 
              style={{ 
                borderRadius: '50%', 
                width: '48px', 
                height: '48px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: isListening ? 'rgba(239,68,68,0.2)' : 'var(--bg-secondary)', 
                color: isListening ? '#ef4444' : 'var(--text-primary)', 
                border: isListening ? '1px solid #ef4444' : '1px solid var(--border-subtle)', 
                flexShrink: 0,
                fontSize: '1.2rem'
              }} 
              title={isListening ? 'Detener dictado' : 'Dictar por voz'}
            >
              {isListening ? '⏹️' : '🎤'}
            </button>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ej: 2 huevos fritos con bacon..." 
              value={aiQuery} 
              onChange={(e) => setAiQuery(e.target.value)} 
              style={{ flex: 1, padding: '0.8rem', fontSize: '1rem' }} 
              autoFocus
            />
          </div>

          {isListening && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#ef4444' }}>
              <span className="recording-dot" />
              <span>Escuchando... Habla a tu ritmo.</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={!aiQuery.trim()} style={{ width: '100%', padding: '0.8rem' }}>
            {pendingAiCount > 0 ? `Buscando (${pendingAiCount})...` : '✨ Buscar Alimento'}
          </button>
        </form>
      </div>
    </div>
  );
}
