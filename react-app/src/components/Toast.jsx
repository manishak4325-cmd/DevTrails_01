import React from 'react';
import { useApp } from '../context/AppContext';

const ICONS = { success: '✅', warning: '⚠️', danger: '❌', info: 'ℹ️' };

export default function ToastContainer() {
  const { state } = useApp();

  return (
    <div className="toast-container" id="toastContainer">
      {state.toasts.map(t => (
        <div key={t.id} className="toast">
          <span>{ICONS[t.type] || 'ℹ️'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
