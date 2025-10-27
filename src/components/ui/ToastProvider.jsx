import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import './toast.css';

const ToastContext = createContext(null);

let idSeq = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const tm = timersRef.current.get(id);
    if (tm) {
      clearTimeout(tm);
      timersRef.current.delete(id);
    }
  }, []);

  const show = useCallback((message, opts = {}) => {
    const id = idSeq++;
    const toast = {
      id,
      message,
      title: opts.title || '',
      type: opts.type || 'info', // 'success' | 'error' | 'info'
      duration: typeof opts.duration === 'number' ? opts.duration : 3500,
    };
    setToasts((list) => [...list, toast]);
    if (toast.duration > 0) {
      const tm = setTimeout(() => remove(id), toast.duration);
      timersRef.current.set(id, tm);
    }
    return id;
  }, [remove]);

  const value = useMemo(() => ({
    show,
    success: (msg, o) => show(msg, { ...(o||{}), type: 'success' }),
    error: (msg, o) => show(msg, { ...(o||{}), type: 'error' }),
    info: (msg, o) => show(msg, { ...(o||{}), type: 'info' }),
    remove,
  }), [show, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container-rt">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-card ${t.type}`} role="status" aria-live="polite">
            <div className="toast-content">
              {t.title ? <div className="toast-title">{t.title}</div> : null}
              <div className="toast-message">{t.message}</div>
            </div>
            <button className="toast-close" aria-label="Close" onClick={() => value.remove(t.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
