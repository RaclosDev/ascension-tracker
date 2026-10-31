import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(rgba(8, 8, 12, 0.82), rgba(5, 5, 8, 0.90)), url(/login-bg.jpg) center/cover no-repeat fixed',
        color: 'var(--text-primary, #fff)',
        padding: '1.5rem',
        position: 'relative',
      }}
    >
      <div
        style={{
          background: '#12121a',
          padding: '2.75rem 2rem',
          borderRadius: '24px',
          border: '1px solid var(--border-medium, rgba(255, 255, 255, 0.12))',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85)',
          textAlign: 'center',
          maxWidth: '420px',
          width: '100%',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo Icon */}
        <div
          style={{
            width: '92px',
            height: '92px',
            borderRadius: '22px',
            overflow: 'hidden',
            margin: '0 auto 1.25rem',
            border: '1.5px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
            background: '#000',
          }}
        >
          <img
            src="/pwa-logo.png"
            alt="Ascension Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>

        <img
          src="/ascension-title.png"
          alt="Ascension"
          style={{
            height: '46px',
            maxWidth: '85%',
            objectFit: 'contain',
            margin: '0 auto 0.75rem',
            display: 'block',
            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.9))',
          }}
        />

        <p
          style={{
            color: 'var(--text-secondary, #94a3b8)',
            fontSize: '0.95rem',
            marginBottom: '2.25rem',
            lineHeight: '1.5',
          }}
        >
          Tu progreso, tu esfuerzo. Inicia sesión para continuar.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                const res = await api.post<{ token?: string }>('/auth/login', {
                  token: credentialResponse.credential,
                });
                if (res.data?.token) {
                  login(res.data.token);
                } else {
                  toast.error('Respuesta de autenticación no válida');
                }
              } catch {
                toast.error(
                  'No se pudo iniciar sesión. Comprueba tu conexión o inténtalo más tarde.',
                );
              }
            }}
            onError={() => {
              toast.error('Error al conectar con Google. Por favor, inténtalo de nuevo.');
            }}
            theme="filled_black"
            shape="pill"
          />
        </div>
      </div>
    </div>
  );
}
