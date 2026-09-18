import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(rgba(8, 8, 12, 0.82), rgba(5, 5, 8, 0.90)), url(/login-bg.jpg) center/cover no-repeat fixed',
      color: 'var(--text-primary, #fff)',
      padding: '1.5rem',
      position: 'relative'
    }}>
      <div style={{
        background: 'rgba(18, 18, 26, 0.78)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '2.75rem 2rem',
        borderRadius: '24px',
        border: '1px solid rgba(220, 38, 38, 0.35)',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85), 0 0 30px rgba(220, 38, 38, 0.22)',
        textAlign: 'center',
        maxWidth: '420px',
        width: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Logo Icon */}
        <div style={{
          width: '92px',
          height: '92px',
          borderRadius: '22px',
          overflow: 'hidden',
          margin: '0 auto 1.25rem',
          border: '1.5px solid rgba(220, 38, 38, 0.65)',
          boxShadow: '0 0 25px rgba(220, 38, 38, 0.45), 0 8px 24px rgba(0, 0, 0, 0.7)',
          background: '#000'
        }}>
          <img 
            src="/pwa-logo.png" 
            alt="Ascension Logo" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover' 
            }} 
          />
        </div>
        
        {/* Title Logo */}
        <img 
          src="/ascension-title.png" 
          alt="Ascension" 
          style={{ 
            height: '46px', 
            maxWidth: '85%', 
            objectFit: 'contain', 
            margin: '0 auto 0.75rem', 
            display: 'block',
            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.9))'
          }} 
        />

        <p style={{ 
          color: 'var(--text-secondary, #94a3b8)', 
          fontSize: '0.95rem',
          marginBottom: '2.25rem',
          lineHeight: '1.5'
        }}>
          Tu progreso, tu esfuerzo. Inicia sesión para continuar.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                const res = await fetch('/api/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token: credentialResponse.credential })
                });
                const data = await res.json();
                if (data.token) {
                  login(data.token, data.refreshToken);
                } else {
                  console.error('Login failed on backend', data);
                }
              } catch (e) {
                console.error('Login error', e);
              }
            }}
            onError={() => {
              console.error('Login Failed');
            }}
            theme="filled_black"
            shape="pill"
          />
        </div>
      </div>
    </div>
  );
}



