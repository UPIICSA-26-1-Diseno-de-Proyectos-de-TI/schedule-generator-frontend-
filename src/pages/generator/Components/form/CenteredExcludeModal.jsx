import React, { useEffect } from 'react';
import './exclude-modal.css';

/**
 * Modal centrado reutilizable.
 * Props:
 *  - open: boolean (si se muestra o no)
 *  - title: string (título del modal)
 *  - onClose: función para cerrar (X, ESC o click fuera)
 *  - children: contenido del cuerpo y pie del modal
 */
export default function CenteredExcludeModal({ open, title, onClose, children }) {
  // Cierre con tecla ESC
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        if (onClose) onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  // Click en el fondo gris cierra el modal
  const handleOverlayClick = () => {
    if (onClose) onClose();
  };

  // Evitar que click dentro del card burbujee al overlay
  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="exclude-modal-overlay" onClick={handleOverlayClick}>
      <div className="exclude-modal-card" onClick={stopPropagation}>
        <div className="exclude-modal-header">
          <h2 className="exclude-modal-title">{title}</h2>
          <button
            type="button"
            className="exclude-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <span>×</span>
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
