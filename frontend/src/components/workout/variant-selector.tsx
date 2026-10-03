import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, X, Check } from 'lucide-react';

interface VariantSelectorProps {
  type: 'grip' | 'machine';
  value?: string;
  onChange: (val?: string) => void;
  historicalOptions: string[];
  globalOptions: string[];
  onAddOption: (val: string) => void;
}

export function VariantSelector({
  type,
  value,
  onChange,
  historicalOptions,
  globalOptions,
  onAddOption,
}: VariantSelectorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const options = new Set(historicalOptions);
  if (value) options.add(value);
  const sortedOptions = Array.from(options).sort();

  const availableGlobals = useMemo(() => {
    return globalOptions.filter(
      (o) => !options.has(o) && o.toLowerCase().includes(inputValue.toLowerCase()),
    );
  }, [globalOptions, options, inputValue]);

  const handleConfirm = (val: string) => {
    if (val.trim()) {
      onAddOption(val.trim());
      onChange(val.trim());
    }
    setIsAdding(false);
    setInputValue('');
  };

  const placeholderText = type === 'grip' ? 'Nuevo agarre (Ej. Prono)' : 'Nueva mÃ¡quina / variante';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
        {sortedOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(value === opt ? undefined : opt)}
            style={{
              padding: '0.3rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              background: value === opt ? 'var(--accent-primary)' : 'var(--bg-primary)',
              color: value === opt ? '#fff' : 'var(--text-primary)',
              border: value === opt ? 'none' : '1px solid var(--border-medium)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {opt}
          </button>
        ))}

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.3rem 0.5rem',
              borderRadius: '6px',
              background: 'transparent',
              border: '1px dashed var(--border-medium)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              gap: '0.2rem',
            }}
          >
            <Plus size={12} />
            <span style={{ fontSize: '0.7rem' }}>Nuevo</span>
          </button>
        )}
      </div>

      {isAdding && (
        <div
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            padding: '0.5rem',
            marginTop: '0.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-primary)',
              border: '1px solid var(--accent-primary)',
              borderRadius: '6px',
              padding: '0.1rem 0.2rem',
            }}
          >
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm(inputValue);
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setInputValue('');
                }
              }}
              placeholder={placeholderText}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: '0.2rem 0.4rem',
                fontSize: '0.75rem',
                color: 'var(--text-primary)',
                flex: 1,
              }}
            />
            <button
              onClick={() => {
                setIsAdding(false);
                setInputValue('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.2rem',
              }}
            >
              <X size={14} />
            </button>
            <button
              onClick={() => handleConfirm(inputValue)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                cursor: 'pointer',
                padding: '0.2rem',
              }}
            >
              <Check size={14} />
            </button>
          </div>

          {availableGlobals.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {availableGlobals.map((g) => (
                <button
                  key={g}
                  onClick={() => handleConfirm(g)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  + {g}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}




