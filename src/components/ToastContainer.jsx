import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

// Global toast event system
const TOAST_EVENT = 'sukinema-toast';

export function showToast(message, type = 'success', duration = 3000) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, {
    detail: { message, type, duration, id: Date.now() }
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
      >
        <X size={15} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

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

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-4 z-[100] flex flex-col-reverse space-y-2 space-y-reverse">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
