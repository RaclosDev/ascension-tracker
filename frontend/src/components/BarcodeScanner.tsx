import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import toast from 'react-hot-toast';

export default function BarcodeScanner({ onScanSuccess, onScanError }) {
  const [isScanning, setIsScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [cameraError, setCameraError] = useState<any>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [scanningFile, setScanningFile] = useState(false);

  const scannerRef = useRef<any>(null);
  const fileInputRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  // Inicializar escÃ¡ner y arrancar cÃ¡mara
  useEffect(() => {
    isMountedRef.current = true;
    const elementId = 'ascension-barcode-reader';
    const scanner = new Html5Qrcode(elementId);
    scannerRef.current = scanner;

    const initCamera = async () => {
      setIsStarting(true);
      setCameraError(null);

      try {
        // Consultar cÃ¡maras disponibles
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0 && isMountedRef.current) {
            setCameras(devices);
          }
        } catch {
          /* empty */
        }

        const config = {
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

        await scanner.start(
          { facingMode: 'environment' },
          config,
          (decodedText, decodedResult) => {
            if (onScanSuccess) {
               
              try {
                /* empty */ navigator.vibrate?.(100);
              } catch {}
              onScanSuccess(decodedText, decodedResult);
            }
          },
          (errorMessage) => {
            if (onScanError) onScanError(errorMessage);
          },
        );

        if (isMountedRef.current) {
          setIsScanning(true);
          setIsStarting(false);
        }
      } catch (err: any) {
        console.warn('No se pudo iniciar la cÃ¡mara automÃ¡ticamente:', err);
        if (isMountedRef.current) {
          setIsStarting(false);
          setIsScanning(false);
          setCameraError(
            err?.name === 'NotAllowedError' || err?.message?.includes('Permission')
              ? 'Permiso de cÃ¡mara denegado. Puedes habilitarlo en los ajustes del navegador o subir una foto directamente.'
              : 'No se encontrÃ³ una cÃ¡mara activa o no se pudo iniciar.',
          );
        }
      }
    };

    initCamera();

    return () => {
      isMountedRef.current = false;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current
            .stop()
            .then(() => {
               
              try {
                /* empty */ scannerRef.current?.clear();
              } catch {}
            })
            .catch(() => {
               
              try {
                /* empty */ scannerRef.current?.clear();
              } catch {}
            });
        } else {
           
          try {
            /* empty */ scannerRef.current?.clear();
          } catch {}
        }
      }
    };
  }, []);

  const handleToggleCamera = async () => {
    if (!scannerRef.current) return;

    if (isScanning) {
      // Detener cÃ¡mara
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (e: any) {
        console.error('Error al detener cÃ¡mara:', e);
      }
    } else {
      // Reanudar cÃ¡mara
      setIsStarting(true);
      setCameraError(null);
      try {
        const cameraId =
          cameras.length > 0 ? cameras[currentCameraIndex]?.id : { facingMode: 'environment' };
        const config = {
          fps: 10,
          qrbox: { width: 260, height: 150 },
          aspectRatio: 1.333,
        };
        await scannerRef.current.start(
          cameraId,
          config,
          (decodedText, decodedResult) => {
            if (onScanSuccess) {
               
              try {
                /* empty */ navigator.vibrate?.(100);
              } catch {}
              onScanSuccess(decodedText, decodedResult);
            }
          },
          () => {},
        );
        setIsScanning(true);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err: any) {
        setCameraError('Error al encender la cÃ¡mara. Revisa los permisos.');
      } finally {
        setIsStarting(false);
      }
    }
  };

  const handleSwitchCamera = async () => {
    if (!scannerRef.current || cameras.length <= 1) return;
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);

    try {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      setIsStarting(true);
      const config = {
        fps: 10,
        qrbox: { width: 260, height: 150 },
        aspectRatio: 1.333,
      };
      await scannerRef.current.start(
        cameras[nextIndex].id,
        config,
        (decodedText, decodedResult) => {
          if (onScanSuccess) {
             
            try {
              /* empty */ navigator.vibrate?.(100);
            } catch {}
            onScanSuccess(decodedText, decodedResult);
          }
        },
        () => {},
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error('Error al cambiar cÃ¡mara:', err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleFileScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !scannerRef.current) return;

    setScanningFile(true);
    try {
      // Si la cÃ¡mara estÃ¡ activa, detenerla primero
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
        setIsScanning(false);
      }

      const decodedText = await scannerRef.current.scanFile(file, true);
      if (decodedText && onScanSuccess) {
         
        try {
          /* empty */ navigator.vibrate?.(100);
        } catch {}
        onScanSuccess(decodedText);
      }
    } catch (err: any) {
      console.warn('Fallo al escanear archivo:', err);
      toast.error('No se detectÃ³ un cÃ³digo de barras claro en la foto. Intenta con otra imagen.', {
        duration: 4000,
      });
    } finally {
      setScanningFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="barcode-scanner-wrapper">
      {/* Visor de CÃ¡mara y RetÃ­cula TÃ¡ctica */}
      <div className="barcode-viewport-frame">
        {/* Contenedor del video de Html5Qrcode */}
        <div id="ascension-barcode-reader"></div>

        {/* RetÃ­culas y LÃ¡ser de Escaneo en Crimson Forge */}
        {isScanning && (
          <>
            <div className="scanner-laser"></div>
            <div className="scanner-reticle-corner tl"></div>
            <div className="scanner-reticle-corner tr"></div>
            <div className="scanner-reticle-corner bl"></div>
            <div className="scanner-reticle-corner br"></div>
          </>
        )}

        {/* Overlay de estado: Cargando */}
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
              Iniciando cÃ¡mara...
            </span>
          </div>
        )}

        {/* Overlay de estado: Escaneando archivo */}
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
              Analizando cÃ³digo en la imagen...
            </span>
          </div>
        )}

        {/* Overlay si la cÃ¡mara estÃ¡ apagada o con error */}
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
              {cameraError ? 'Acceso a CÃ¡mara Limitado' : 'CÃ¡mara en Pausa'}
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
                'Enfoca el cÃ³digo de barras del producto o sube una foto de la etiqueta.'}
            </p>
          </div>
        )}
      </div>

      {/* Input de archivo oculto */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileScan}
      />

      {/* Botones de Control de EscÃ¡ner */}
      <div className="scanner-controls">
        <button
          type="button"
          className={`btn ${isScanning ? 'btn-secondary' : 'btn-primary'}`}
          style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem' }}
          onClick={handleToggleCamera}
          disabled={isStarting || scanningFile}
        >
          {isScanning ? ' Pausar CÃ¡mara' : ' Iniciar CÃ¡mara'}
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
            onClick={handleSwitchCamera}
            title="Cambiar CÃ¡mara"
          ></button>
        )}

        <button
          type="button"
          className="btn btn-secondary"
          style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem', borderStyle: 'dashed' }}
          onClick={() => fileInputRef.current?.click()}
          disabled={scanningFile}
        >
          Subir Foto
        </button>
      </div>

      <p
        style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}
      >
        Compatible con cÃ³digos de barras de supermercados espaÃ±oles y europeos (EAN-13, EAN-8 y
        UPC).
      </p>
    </div>
  );
}




