// src/pages/generator/Components/CareerSelector.js
import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { useDispatch, useSelector } from 'react-redux';
import { setCareer } from '../../../../../store/slices/form/formSlice';

Modal.setAppElement('#root');

const BookIcon = ({ size = 34, stroke = 'rgba(255,255,255,0.95)' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect
      x="3"
      y="4"
      width="14"
      height="14"
      rx="1.5"
      stroke={stroke}
      strokeWidth="1.2"
      fill="rgba(255,255,255,0.08)"
    />
    <path
      d="M7 7h8"
      stroke={stroke}
      strokeWidth="1.1"
      strokeLinecap="round"
    />
  </svg>
);

function deterministicDarkColor(key) {
  const s = String(key || 'x');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  const hue = Math.abs(h) % 360;
  const sat = 62 + (Math.abs(h) % 18);
  const light = 28 + (Math.abs(h) % 10);
  return `hsl(${hue} ${sat}% ${light}%)`;
}

/** Dada una cadena "hsl(H S% L%)" la hace más oscura (reduce L en delta %) */
function hoverColor(hslString, delta = 7) {
  if (!hslString || typeof hslString !== 'string') return hslString;
  const m = hslString.match(
    /hsl\(\s*([0-9.-]+)\s+([0-9.-]+)%\s+([0-9.-]+)%\s*\)/i
  );
  if (!m) return hslString;
  let hue = Number(m[1]);
  let sat = Number(m[2]);
  let light = Number(m[3]);
  light = Math.max(4, light - delta);
  sat = Math.min(95, sat + 3);
  return `hsl(${hue} ${sat}% ${light}%)`;
}

export default function CareerSelector() {
  const dispatch = useDispatch();
  const career = useSelector((state) => state.form.career);

  // 🔹 Ya NO se abre siempre; arranca cerrado
  const [isOpen, setIsOpen] = useState(false);
  const [careers, setCareers] = useState([]);
  const [hovered, setHovered] = useState(null);

  // ----- 1) Cargar lista de carreras desde sessionStorage -----
  useEffect(() => {
    try {
      const s = sessionStorage.getItem('saes_carreras');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          setCareers(
            parsed.map((it, i) => ({
              value: it.value ?? it.clave ?? String(i),
              text:
                (it.text || it.nombre || it.name || String(it.value || '')).toUpperCase(),
              planes: it.planes || it.plans || [],
              color: deterministicDarkColor(
                it.value ?? it.clave ?? it.text ?? i
              ),
            }))
          );
          return;
        }
      }
      const ud = sessionStorage.getItem('saes_user_data');
      if (ud) {
        const obj = JSON.parse(ud);
        const parsed =
          (obj.carrera_info && obj.carrera_info.carreras) ||
          obj.carreras ||
          [];
        setCareers(
          parsed.map((it, i) => ({
            value: it.value ?? it.clave ?? String(i),
            text:
              (it.text || it.nombre || it.name || String(it.value || '')).toUpperCase(),
            planes: it.planes || it.plans || [],
            color: deterministicDarkColor(
              it.value ?? it.clave ?? it.text ?? i
            ),
          }))
        );
      }
    } catch (e) {
      console.error('CareerSelector read error', e);
    }
  }, []);

  // ----- 2) Escuchar evento global para reabrir modal -----
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('open-career-selector', handler);
    return () => window.removeEventListener('open-career-selector', handler);
  }, []);

  // ----- 3) Abrir SOLO la primera vez que no hay carrera -----
  useEffect(() => {
    try {
      const hasCareerFlag =
        sessionStorage.getItem('generator_has_career') === 'true';

      if (!career && !hasCareerFlag) {
        // primera vez sin carrera: abrimos modal
        setIsOpen(true);
      }
    } catch {
      if (!career) setIsOpen(true);
    }
  }, [career]);

  const handleSelect = (c) => {
    dispatch(setCareer(c));
    setIsOpen(false);
    // marcamos que ya se eligió al menos una vez
    try {
      sessionStorage.setItem('generator_has_career', 'true');
    } catch {
      /* noop */
    }
  };

  // estilos 
  const modalStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      transform: 'translate(-50%, -50%)',
      width: '86vw',
      maxWidth: '1200px',
      height: '78vh',
      padding: 0,
      borderRadius: 12,
      border: 'none',
      overflow: 'hidden',
      boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
      background: '#ffffff',
    },
    overlay: {
      backgroundColor: 'rgba(0,0,0,0.45)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  };

  return (
    <Modal
      isOpen={isOpen}
      shouldCloseOnOverlayClick={false}
      style={modalStyles}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div
          style={{
            padding: 18,
            borderBottom: '1px solid #eee',
            textAlign: 'center',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 20 }}>Elige tu carrera</h3>
        </div>

        <div style={{ padding: 18, overflowY: 'auto', flex: 1 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 16,
              alignItems: 'start',
            }}
          >
            {careers && careers.length > 0 ? (
              careers.map((c, idx) => {
                const base = c.color;
                const hoverBg = hoverColor(base, 8);
                const isHovered = hovered === c.value;

                const btnStyle = {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 18,
                  minHeight: 96,
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  background: `linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.02)), ${
                    isHovered ? hoverBg : base
                  }`,
                  color: '#fff',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  boxShadow: isHovered
                    ? '0 14px 36px rgba(0,0,0,0.18)'
                    : '0 8px 20px rgba(0,0,0,0.08)',
                  transform: isHovered
                    ? 'translateY(-6px) scale(1.02)'
                    : 'none',
                  transition:
                    'transform .14s cubic-bezier(.2,.9,.2,1), box-shadow .14s ease, filter .14s ease',
                };

                return (
                  <button
                    key={c.value ?? idx}
                    onClick={() => handleSelect(c)}
                    aria-label={`Seleccionar ${c.text}`}
                    style={btnStyle}
                    onMouseEnter={() => setHovered(c.value)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(c.value)}
                    onBlur={() => setHovered(null)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <BookIcon size={28} />
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          textAlign: 'center',
                          padding: '0 4px',
                        }}
                      >
                        {c.text}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div style={{ padding: 12, color: '#444' }}>
                No se encontraron carreras — intenta reiniciar sesión
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
