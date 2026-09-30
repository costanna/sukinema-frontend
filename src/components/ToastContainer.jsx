import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useI18n } from '../i18n';

// Global toast event system
const TOAST_EVENT = 'sukinema-toast';
let nextToastId = 0;

export function showToast(message, type = 'success', duration = 3000) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, {
    detail: { message, type, duration, id: ++nextToastId }
  }));
}

const ICONS = {
  success: <CheckCircle size={18} className="text-green-400 flex-shrink-0" />,
  error: <XCircle size={18} className="text-red-400 flex-shrink-0" />,
  info: <Info size={18} className="text-blue-400 flex-shrink-0" />,
  warning: <AlertTriangle size={18} className="text-yellow-400 flex-shrink-0" />,
};

const BG = {
  success: 'border-green-700/40 bg-[#1a2a1a]',
  error: 'border-red-700/40 bg-[#2a1a1a]',
  info: 'border-blue-700/40 bg-[#1a1a2a]',
  warning: 'border-yellow-700/40 bg-[#2a2a1a]',
};

function ToastItem({ toast, onRemove }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));
    // Animate out before removal
    const leaveTimer = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration - 300);
    return () => clearTimeout(leaveTimer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      role="status"
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-xl text-sm text-gray-100 max-w-sm w-full transition-all duration-300 ${
        BG[toast.type] || BG.info
      } ${
        visible && !leaving
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-8'
      }`}
    >
      {ICONS[toast.type] || ICONS.info}
      <span className="flex-1 font-medium">{toast.message}</span>
      <button
        onClick={() => { setLeaving(true); setTimeout(() => onRemove(toast.id), 300); }}
        className="text-gray-500 hover:text-gray-200 transition"
        aria-label={t('common.closeToast')}
      >
        <X size={15} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const containerRef = useRef(null);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      setToasts(prev => [...prev.slice(-4), e.detail]); // max 5 toasts
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, []);

  // Las ventanas <dialog> se pintan en la "capa superior" del navegador, por encima de cualquier z-index.
  // El contenedor es un popover para entrar en esa misma capa, y se vuelve a mostrar con cada aviso
  // y cada vez que se abre una ventana, de modo que siempre quede el último (encima).
  const lastToastId = toasts.length > 0 ? toasts[toasts.length - 1].id : null;
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof container.showPopover !== 'function') return;

    const raise = () => {
      try {
        if (container.matches(':popover-open')) container.hidePopover();
        container.showPopover();
      } catch (e) {
        console.warn(e);
      }
    };
    raise();

    const observer = new MutationObserver((mutations) => {
      if (mutations.some(m => m.target instanceof HTMLDialogElement && m.target.open)) raise();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['open'], subtree: true });
    return () => observer.disconnect();
  }, [lastToastId]);

  if (toasts.length === 0) return null;

  return (
    <div
      ref={containerRef}
      popover="manual"
      className="fixed inset-auto bottom-6 right-4 z-[100] m-0 p-0 border-0 bg-transparent overflow-visible text-inherit flex flex-col-reverse space-y-2 space-y-reverse"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
