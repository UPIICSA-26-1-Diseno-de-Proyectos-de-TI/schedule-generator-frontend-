// src/pages/Login/index.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css'; // asegúrate de que exista

const API_BASE = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';

export default function Login() {
  const navigate = useNavigate();

  // estados
  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem('saes_sessionId') || null);
  const [captchaSrc, setCaptchaSrc] = useState(null);
  const [hiddenFields, setHiddenFields] = useState(null);
  const [cookies, setCookies] = useState(() => {
    try {
      const s = sessionStorage.getItem('saes_cookies');
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  });
  const [boleta, setBoleta] = useState('');
  const [clave, setClave] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ kind: 'idle', msg: '' }); // idle | loading | success | error

  // overlay states: controla la pantalla de carga y iconos
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayResult, setOverlayResult] = useState(null); // null | 'success' | 'error'

  // refs para evitar fetchs duplicados (StrictMode)
  const didInitRef = useRef(false);
  const fetchingCaptchaRef = useRef(false);
  const blobUrlRef = useRef(null);

  // ---------- utilidades ----------
  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  function byteArrayToBlob(byteArray, mime = 'image/jpeg') {
    return new Blob([new Uint8Array(byteArray)], { type: mime });
  }

  function formatServerError(result) {
    if (!result) return 'Error en la respuesta del servidor.';
    if (Array.isArray(result.detail)) {
      try {
        return result.detail.map(d => {
          const loc = Array.isArray(d.loc) ? d.loc.join('.') : String(d.loc);
          const msg = d.msg || JSON.stringify(d);
          return `${loc}: ${msg}`;
        }).join(' • ');
      } catch (e) {
        return JSON.stringify(result.detail);
      }
    }
    if (typeof result.detail === 'string') return result.detail;
    if (result.message) return result.message;
    if (result.error) return typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
    try { return JSON.stringify(result); } catch(e) { return 'Error inesperado'; }
  }

  // ---------- fetchCaptchaFromUrl (robusto) ----------
  async function fetchCaptchaFromUrl(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('captcha request failed: ' + res.status);
    const contentType = (res.headers.get('content-type') || '').toLowerCase();

    if (contentType.includes('application/json')) {
      const data = await res.json();

      if (data.hidden_fields || data.hiddenFields || data.hidden) setHiddenFields(data.hidden_fields || data.hiddenFields || data.hidden);
      if (data.cookies) {
        setCookies(data.cookies);
        try { sessionStorage.setItem('saes_cookies', JSON.stringify(data.cookies)); } catch(e) {}
      }

      const base64 = data.captcha_base64 || data.captcha || (data.captcha_image && data.captcha_image.base64);
      const src = data.captcha_src || (data.captcha_image && data.captcha_image.src);
      const ct = data.content_type || (data.captcha_image && data.captcha_image.content_type) || 'image/jpeg';
      const byteArray = data.bytes || data.image_bytes || data.byteArray;

      if (base64) return `data:${ct};base64,${base64}`;
      if (src) return src;
      if (Array.isArray(byteArray) && byteArray.length > 0) {
        const blob = byteArrayToBlob(byteArray, ct);
        if (blobUrlRef.current) try { URL.revokeObjectURL(blobUrlRef.current); } catch (e) {}
        const u = URL.createObjectURL(blob);
        blobUrlRef.current = u;
        return u;
      }

      throw new Error('JSON recibido pero sin captcha válido');
    }

    if (contentType.startsWith('image/')) {
      const blob = await res.blob();
      if (blobUrlRef.current) try { URL.revokeObjectURL(blobUrlRef.current); } catch(e) {}
      const objectUrl = URL.createObjectURL(blob);
      blobUrlRef.current = objectUrl;
      return objectUrl;
    }

    if (contentType === 'application/octet-stream' || contentType === '') {
      const buffer = await res.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      return `data:image/jpeg;base64,${base64}`;
    }

    const text = await res.text();
    throw new Error('Respuesta captcha inesperada: ' + contentType + ' / ' + text.slice(0,200));
  }

  // ---------- init / load / refresh captcha ----------
  async function initSession() {
    if (fetchingCaptchaRef.current) return false;
    fetchingCaptchaRef.current = true;
    setStatus({ kind: 'loading', msg: 'Inicializando sesión...' });

    try {
      const res = await fetch(`${API_BASE}/captcha`);
      if (!res.ok) throw new Error('Fallo al inicializar sesión: ' + res.status);
      const data = await res.json();

      const sid = data.session_id || data.sessionId || null;
      if (sid) {
        sessionStorage.setItem('saes_sessionId', sid);
        setSessionId(sid);
      }

      if (data.hidden_fields || data.hiddenFields || data.hidden) setHiddenFields(data.hidden_fields || data.hiddenFields || data.hidden);
      if (data.cookies) {
        setCookies(data.cookies);
        try { sessionStorage.setItem('saes_cookies', JSON.stringify(data.cookies)); } catch(e) {}
      }

      if (data.captcha_image) {
        const imgObj = data.captcha_image;
        if (imgObj.base64) {
          const ct = imgObj.content_type || 'image/jpeg';
          setCaptchaSrc(`data:${ct};base64,${imgObj.base64}`);
          setStatus({ kind: 'idle', msg: '' });
          return true;
        } else if (imgObj.src) {
          setCaptchaSrc(imgObj.src);
          setStatus({ kind: 'idle', msg: '' });
          return true;
        }
      }

      if (sid) {
        try {
          const url = `${API_BASE}/captcha?session_id=${encodeURIComponent(sid)}`;
          const img = await fetchCaptchaFromUrl(url);
          setCaptchaSrc(img);
          setStatus({ kind: 'idle', msg: '' });
          return true;
        } catch (e) {
          console.warn('[initSession] fallback falló', e);
        }
      }

      throw new Error('initSession: no se obtuvo captcha válido');
    } catch (err) {
      console.error('[initSession] error:', err);
      setStatus({ kind: 'error', msg: 'No se pudo iniciar la sesión. Intenta recargar.' });
      return false;
    } finally {
      fetchingCaptchaRef.current = false;
    }
  }

  async function loadCaptchaForSession(sid) {
    if (!sid) return initSession();
    if (fetchingCaptchaRef.current) return false;
    fetchingCaptchaRef.current = true;
    setStatus({ kind: 'loading', msg: 'Cargando CAPTCHA...' });
    try {
      const url = `${API_BASE}/captcha?session_id=${encodeURIComponent(sid)}`;
      const img = await fetchCaptchaFromUrl(url);
      setCaptchaSrc(img);
      setStatus({ kind: 'idle', msg: '' });
      return true;
    } catch (err) {
      console.error('loadCaptchaForSession error', err);
      setStatus({ kind: 'error', msg: 'No se pudo cargar el CAPTCHA.' });
      throw err;
    } finally {
      fetchingCaptchaRef.current = false;
    }
  }

  async function refreshCaptcha() {
    if (fetchingCaptchaRef.current) return;
    fetchingCaptchaRef.current = true;
    setStatus({ kind: 'loading', msg: 'Refrescando CAPTCHA...' });
    try {
      const url = `${API_BASE}/captcha/refresh${sessionId ? ('?session_id=' + encodeURIComponent(sessionId)) : ''}`;
      const img = await fetchCaptchaFromUrl(url);
      setCaptchaSrc(img);
      setStatus({ kind: 'idle', msg: '' });
      return true;
    } catch (err) {
      console.warn('refreshCaptcha fallback to initSession', err);
      await initSession();
    } finally {
      fetchingCaptchaRef.current = false;
    }
  }

  // ---------- handle login con overlay y animación ----------
  async function handleSubmit(e) {
    e.preventDefault();
    if (!boleta || !clave || !captchaText) {
      setStatus({ kind: 'error', msg: 'Completa todos los campos.' });
      return;
    }
    if (!cookies) {
      setStatus({ kind: 'error', msg: 'Sesión de captcha incompleta. Recargando CAPTCHA...' });
      await initSession();
      return;
    }

    // mostrar overlay (pantalla de carga)
    setOverlayVisible(true);
    setOverlayResult(null); // aún sin resultado
    setLoading(true);
    setStatus({ kind: 'loading', msg: 'Iniciando sesión...' });

    try {
      const payload = {
        session_id: sessionId,
        boleta,
        password: clave,
        captcha_code: captchaText,
        hidden_fields: hiddenFields,
        cookies: cookies || {}
      };

      console.log('[login] payload ->', payload);

      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let result = null;
      try { result = await res.json(); } catch (_) { result = null; }

      console.log('[login] status', res.status, 'result ->', result);

      if (res.ok && result && (result.success || result.logged_in || result.status === 'ok' || result.status === 'success')) {
        // Guardar datos para siguiente pantalla
        try {
          sessionStorage.setItem('saes_user_data', JSON.stringify(result));
          const carreras = (result.carrera_info && result.carrera_info.carreras) || result.carreras || [];
          sessionStorage.setItem('saes_carreras', JSON.stringify(carreras));
          if (result.session_id) {
            sessionStorage.setItem('saes_sessionId', result.session_id);
            setSessionId(result.session_id);
          }
        } catch (e) { console.warn(e); }

        // efecto visual: icono success y redirect
        setOverlayResult('success');
        setStatus({ kind: 'success', msg: result.message || 'Inicio exitoso' });

        // limpiar
        setClave(''); setCaptchaText('');
        try { sessionStorage.removeItem('saes_cookies'); } catch(e) {}
        setCookies(null);

        // esperar un poco para que el usuario vea el check y luego navegar
        setTimeout(() => {
          setOverlayVisible(false);
          navigate('/generator');
        }, 800);
        return;
      } else {
        const serverMsg = formatServerError(result);
        setStatus({ kind: 'error', msg: serverMsg });

        // icono de error
        setOverlayResult('error');

        // mostrar error brevemente y refrescar captcha
        setTimeout(() => {
          setOverlayVisible(false);
          refreshCaptcha();
          setOverlayResult(null);
        }, 1200);
        return;
      }
    } catch (err) {
      console.error('handleSubmit error', err);
      setStatus({ kind: 'error', msg: 'Error de conexión al servidor. Intenta de nuevo.' });
      setOverlayResult('error');
      setTimeout(() => {
        setOverlayVisible(false);
        setOverlayResult(null);
      }, 1200);
    } finally {
      setLoading(false);
    }
  }

  // ---------- efecto init protegido ----------
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    (async () => {
      if (!sessionId) {
        await initSession();
      } else {
        try { await loadCaptchaForSession(sessionId); } catch (e) { await initSession(); }
      }
    })();

    return () => {
      if (blobUrlRef.current) {
        try { URL.revokeObjectURL(blobUrlRef.current); } catch(e) {}
        blobUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showSpinner = loading || status.kind === 'loading';

  // ---------- pequeños componentes internos para iconos (SVG) ----------
  const SuccessIcon = () => (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="11" stroke="#16a34a" strokeWidth="2" fill="rgba(22,163,74,0.08)"/>
      <path d="M7 13l3 3 7-7" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const ErrorIcon = () => (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="11" stroke="#dc2626" strokeWidth="2" fill="rgba(220,38,38,0.06)"/>
      <path d="M9 9l6 6M15 9l-6 6" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div className="login-page">
      <div className="split">
        <aside className="left-panel" aria-hidden="true" />

        <div className="divider" />

        <section className="right-panel">
          <div className="card title-card">
            <h1>Sistema Generador de Horarios Académicos – UPIICSA</h1>
          </div>

          <div className="card login-card" role="region" aria-label="Módulo de acceso">
            <form onSubmit={handleSubmit} className={`login-form ${overlayVisible ? 'muted' : ''}`} autoComplete="off">
              <label>
                Número de boleta
                <input type="text" value={boleta} onChange={e => setBoleta(e.target.value)} placeholder="Ej. 2023123456" />
              </label>

              <label>
                Clave
                <input type="password" value={clave} onChange={e => setClave(e.target.value)} placeholder="Tu clave" />
              </label>

              <div className="captcha-row">
                <div className="captcha-box">
                  {captchaSrc ? (
                    <img className="captcha-img" src={captchaSrc} alt="CAPTCHA" />
                  ) : (
                    <div className="captcha-placeholder">Cargando...</div>
                  )}
                  <button type="button" className="icon-btn" onClick={refreshCaptcha} title="Refrescar CAPTCHA">⟳</button>
                </div>
              </div>

              <label>
                Texto de la imagen
                <input type="text" value={captchaText} onChange={e => setCaptchaText(e.target.value)} placeholder="Escribe el texto del CAPTCHA" />
              </label>

              <button type="submit" className="btn-primary" disabled={showSpinner}>
                {showSpinner ? (<span className="btn-with-spinner"><span className="spinner" /> Iniciando...</span>) : 'Iniciar sesión'}
              </button>
            </form>

            <div className={`status ${status.kind}`}>
              {status.msg && <div className="status-msg">{status.msg}</div>}
            </div>
          </div>
        </section>
      </div>

      {/* OVERLAY: pantalla de carga + icono de resultado */}
      {overlayVisible && (
        <div className="login-overlay" role="status" aria-live="polite">
          <div className="overlay-content">
            {/* spinner cuando aún no hay resultado */}
            {!overlayResult && (
              <>
                <div className="big-spinner" aria-hidden />
                <div className="overlay-text">Verificando credenciales...</div>
              </>
            )}

            {/* success */}
            {overlayResult === 'success' && (
              <>
                <SuccessIcon />
                <div className="overlay-text success">Acceso concedido</div>
              </>
            )}

            {/* error */}
            {overlayResult === 'error' && (
              <>
                <ErrorIcon />
                <div className="overlay-text error">Acceso denegado</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
