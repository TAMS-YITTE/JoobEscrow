'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // showToast('success' | 'error', message)
  const showToast = useCallback((type, message) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
          display: 'flex', flexDirection: 'column', gap: '10px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            onClick={() => dismiss(toast.id)}
            style={{
              maxWidth: '360px', padding: '14px 18px', borderRadius: '12px',
              background: '#0d0f17', cursor: 'pointer', pointerEvents: 'auto',
              border: `1px solid ${toast.type === 'success' ? '#22c55e' : '#ef4444'}`,
              boxShadow: `0 8px 30px rgba(0,0,0,0.5), 0 0 0 1px ${toast.type === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              animation: 'toastIn 0.25s ease-out',
            }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1.2, color: toast.type === 'success' ? '#22c55e' : '#ef4444' }}>
              {toast.type === 'success' ? '✓' : '⚠️'}
            </span>
            <span style={{ fontSize: '0.875rem', color: '#e5e7eb', lineHeight: 1.4 }}>
              {toast.message}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback so a missing provider never crashes an action handler.
    return { showToast: (_type, message) => console.warn('[toast]', message) };
  }
  return ctx;
}
