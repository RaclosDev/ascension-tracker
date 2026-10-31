import { useState, useEffect, useRef, useLayoutEffect, ChangeEvent } from 'react';
import { Html5Qrcode, Html5QrcodeResult, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { haptics } from '@/lib/haptics';

const SCANNER_CONFIG = {
  fps: 10,
  qrbox: { width: 260, height: 150 },
  aspectRatio: 1.333,
  formatsToSupport: [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.QR_CODE,
  ],
};

interface CameraDevice {
  id: string;
  label: string;
}

interface BarcodeScannerProps {
  onScanSuccess?: (decodedText: string, decodedResult?: Html5QrcodeResult) => void;
  onScanError?: (errorMessage: string) => void;
}

export default function BarcodeScanner({ onScanSuccess, onScanError }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [scanningFile, setScanningFile] = useState(false);

  const sessionRef = useRef<{
    scanner: Html5Qrcode;
    disposed: boolean;
    pending: Promise<void>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const callbacksRef = useRef({ onScanSuccess, onScanError });
  useLayoutEffect(() => {
    callbacksRef.current = { onScanSuccess, onScanError };
  }, [onScanSuccess, onScanError]);

  useEffect(() => {
    const session = {
      scanner: new Html5Qrcode('ascension-barcode-reader'),
      disposed: false,
      pending: Promise.resolve(),
    };
    sessionRef.current = session;
    session.pending = (async () => {
      setIsStarting(true);
      setCameraError(null);
      try {
        try {
          const devices = await Html5Qrcode.getCameras();
          if (!session.disposed) setCameras(devices);
        } catch {
          // A facing-mode request can still work when device enumeration fails.
        }
        if (session.disposed) return;
        await session.scanner.start(
          { facingMode: 'environment' },
          SCANNER_CONFIG,
          (text, result) => {
            if (!session.disposed) {
              haptics.success();
              callbacksRef.current.onScanSuccess?.(text, result);
            }
          },
          (error) => {
            if (!session.disposed) callbacksRef.current.onScanError?.(error);
          },
        );
        if (!session.disposed) setIsScanning(true);
      } catch (error) {
        if (!session.disposed) {
          setIsScanning(false);
          const denied =
            error instanceof Error &&
            (error.name === 'NotAllowedError' || error.message.includes('Permission'));
          setCameraError(
            denied
              ? 'Permiso de c\u00e1mara denegado. Puedes habilitarlo en los ajustes del navegador o subir una foto directamente.'
              : 'No se encontr\u00f3 una c\u00e1mara activa o no se pudo iniciar.',
          );
        }
      } finally {
        if (!session.disposed) setIsStarting(false);
      }
    })();
    return () => {
      session.disposed = true;
      // start() may resolve after unmount: wait for it before releasing its stream.
      void session.pending.finally(async () => {
        try {
          if (session.scanner.isScanning) await session.scanner.stop();
        } catch {
          // clear may still release the scanner's DOM after stop fails.
        }
        if (sessionRef.current === session) {
          try {
            session.scanner.clear();
          } catch {
            /* The host may already be detached. */
          }
          sessionRef.current = null;
        }
      });
    };
  }, []);

  const runCameraOperation = (
    operation: (session: NonNullable<typeof sessionRef.current>) => Promise<void>,
  ) => {
    const session = sessionRef.current;
    if (!session || session.disposed) return;
    session.pending = session.pending.then(async () => {
      if (!session.disposed) await operation(session);
    });
  };

  const startCamera = async (
    session: NonNullable<typeof sessionRef.current>,
    cameraIndex: number,
  ) => {
    await session.scanner.start(
      cameras[cameraIndex]?.id ?? { facingMode: 'environment' },
      SCANNER_CONFIG,
      (text, result) => {
        if (!session.disposed) {
          haptics.success();
          callbacksRef.current.onScanSuccess?.(text, result);
        }
      },
      () => {},
    );
    if (!session.disposed) setIsScanning(true);
  };

  const handleToggleCamera = () => {
    setIsStarting(true);
    runCameraOperation(async (session) => {
      try {
        if (session.scanner.isScanning) {
          await session.scanner.stop();
          if (!session.disposed) setIsScanning(false);
        } else {
          setCameraError(null);
          await startCamera(session, currentCameraIndex);
        }
      } catch {
        if (!session.disposed)
          setCameraError('Error al cambiar el estado de la c\u00e1mara. Revisa los permisos.');
      } finally {
        if (!session.disposed) setIsStarting(false);
      }
    });
  };

  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setIsStarting(true);
    runCameraOperation(async (session) => {
      try {
        if (session.scanner.isScanning) await session.scanner.stop();
        if (session.disposed) return;
        setIsScanning(false);
        await startCamera(session, nextIndex);
        if (!session.disposed) setCurrentCameraIndex(nextIndex);
      } catch {
        if (!session.disposed) setCameraError('No se pudo cambiar de c\u00e1mara.');
      } finally {
        if (!session.disposed) setIsStarting(false);
      }
    });
  };

  const handleFileScan = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setScanningFile(true);
    runCameraOperation(async (session) => {
      try {
        if (session.scanner.isScanning) await session.scanner.stop();
        if (session.disposed) return;
        setIsScanning(false);
        const text = await session.scanner.scanFile(file, true);
        if (!session.disposed && text) {
          haptics.success();
          callbacksRef.current.onScanSuccess?.(text);
        }
      } catch {
        if (!session.disposed)
          toast.error(
            'No se detect\u00f3 un c\u00f3digo de barras claro en la foto. Intenta con otra imagen.',
            { duration: 4000 },
          );
      } finally {
        if (!session.disposed) {
          setScanningFile(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      }
    });
  };

  return (
    <div className="barcode-scanner-wrapper">
      <div className="barcode-viewport-frame">
        {/* Contenedor del video de Html5Qrcode */}
        <div id="ascension-barcode-reader"></div>

        {isScanning && (
          <>
            <div className="scanner-laser"></div>
            <div className="scanner-reticle-corner tl"></div>
            <div className="scanner-reticle-corner tr"></div>
            <div className="scanner-reticle-corner bl"></div>
            <div className="scanner-reticle-corner br"></div>
          </>
        )}

        {isStarting && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: 'rgba(6, 7, 9, 0.88)',
              zIndex: 15,
              color: 'var(--text-chalk)',
            }}
          >
            <div className="spinner" style={{ width: '28px', height: '28px' }}></div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Iniciando cámara...
            </span>
          </div>
        )}

        {scanningFile && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: 'rgba(6, 7, 9, 0.88)',
              zIndex: 15,
              color: 'var(--text-chalk)',
            }}
          >
            <div className="spinner" style={{ width: '28px', height: '28px' }}></div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Analizando código en la imagen...
            </span>
          </div>
        )}

        {!isScanning && !isStarting && !scanningFile && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              textAlign: 'center',
              gap: '8px',
              background: 'rgba(10, 12, 15, 0.95)',
              zIndex: 14,
            }}
          >
            <div style={{ fontSize: '2.2rem', marginBottom: '4px' }}></div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {cameraError ? 'Acceso a Cámara Limitado' : 'Cámara en Pausa'}
            </div>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                maxWidth: '320px',
                margin: 0,
              }}
            >
              {cameraError ||
                'Enfoca el código de barras del producto o sube una foto de la etiqueta.'}
            </p>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileScan}
      />

      <div className="scanner-controls">
        <button
          type="button"
          className={`btn ${isScanning ? 'btn-secondary' : 'btn-primary'}`}
          style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem' }}
          onClick={handleToggleCamera}
          disabled={isStarting || scanningFile}
        >
          {isScanning ? ' Pausar Cámara' : ' Iniciar Cámara'}
        </button>

        {cameras.length > 1 && isScanning && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{
              padding: '10px',
              width: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            disabled={isStarting || scanningFile}
            onClick={handleSwitchCamera}
            title="Cambiar Cámara"
            aria-label="Cambiar Cámara"
          >
            <RefreshCw size={18} />
          </button>
        )}

        <button
          type="button"
          className="btn btn-secondary"
          style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem', borderStyle: 'dashed' }}
          onClick={() => fileInputRef.current?.click()}
          disabled={isStarting || scanningFile}
        >
          Subir Foto
        </button>
      </div>

      <p
        style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}
      >
        Compatible con códigos de barras de supermercados españoles y europeos (EAN-13, EAN-8 y
        UPC).
      </p>
    </div>
  );
}
