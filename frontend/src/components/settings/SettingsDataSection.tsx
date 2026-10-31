import { Download, UploadCloud, LogOut } from 'lucide-react';

interface SettingsDataSectionProps {
  isExportingJson: boolean;
  onExportJson: () => void;
  onOpenRestoreModal: () => void;
  onExportCsv: () => void;
  onLogout: () => void;
}

export function SettingsDataSection({
  isExportingJson,
  onExportJson,
  onOpenRestoreModal,
  onExportCsv,
  onLogout,
}: SettingsDataSectionProps) {
  return (
    <>
      {/* Backup & Privacy / Copia de Seguridad */}
      <div
        className="card accordion-card mb-4"
        style={{
          padding: 'var(--space-lg)',
          transition: 'all 0.25s ease',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex items-center gap-2">
            <Download size={20} style={{ color: 'var(--color-primary)' }} />
            <span
              className="card-title"
              style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              Copia de Seguridad y Privacidad
            </span>
          </div>
        </div>
        <div
          style={{
            marginTop: '1.25rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '1.25rem',
          }}
        >
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Descarga una copia de seguridad completa con todos tus entrenamientos, ejercicios
            personalizados, plantillas, registros de comidas, recetas, alimentos guardados, pasos,
            peso y ajustes en formato JSON (GDPR).
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              marginBottom: '1.5rem',
            }}
          >
            <button
              className="btn btn-primary min-h-11"
              style={{ width: '100%' }}
              onClick={onExportJson}
              disabled={isExportingJson}
              aria-busy={isExportingJson}
              aria-label={
                isExportingJson ? 'Exportando datos en curso' : 'Exportar copia de seguridad (JSON)'
              }
            >
              {isExportingJson ? 'Exportando datos...' : 'Exportar copia de seguridad (JSON)'}
            </button>
            <button
              className="btn btn-secondary"
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: '44px',
              }}
              onClick={onOpenRestoreModal}
            >
              <UploadCloud size={18} />
              Restaurar copia de seguridad (JSON)
            </button>
          </div>
          <div
            style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '1.5rem 0' }}
          />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Descarga todos tus datos de peso registrados en un archivo CSV.
          </p>
          <button
            className="btn btn-secondary min-h-11"
            style={{ width: '100%' }}
            onClick={onExportCsv}
            aria-label="Exportar datos a CSV"
          >
            Exportar Datos a CSV
          </button>
        </div>
      </div>

      {/* Account / Logout */}
      <div
        className="card accordion-card"
        style={{
          padding: 'var(--space-lg)',
          transition: 'all 0.25s ease',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex items-center gap-2">
            <LogOut size={20} style={{ color: 'var(--color-danger, #ef4444)' }} />
            <span
              className="card-title"
              style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--color-danger, #ef4444)',
              }}
            >
              Cuenta
            </span>
          </div>
        </div>
        <div
          style={{
            marginTop: '1.25rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '1.25rem',
          }}
        >
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Cierra tu sesión de forma segura en este dispositivo.
          </p>
          <button
            className="btn btn-secondary min-h-11"
            style={{
              width: '100%',
              borderColor: 'rgba(239, 68, 68, 0.5)',
              color: '#ef4444',
              background: 'rgba(239, 68, 68, 0.1)',
            }}
            onClick={onLogout}
            aria-label="Cerrar sesión"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}
