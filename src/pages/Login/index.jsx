// src/pages/Login/index.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';

// const API_BASE = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:3000';
const API_BASE = process.env.REACT_APP_API_ENDPOINT || 'http://127.0.0.1:3000';

export default function Login() {
  const navigate = useNavigate();

  // estados
  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem('saes_sessionId') || null);
  const [captchaSrc, setCaptchaSrc] = useState(null);
  const [hiddenFields, setHiddenFields] = useState(null); // compatibilidad con backend viejo
  const [cookies, setCookies] = useState(() => {
    try {
      const s = sessionStorage.getItem('saes_cookies');
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  });
  const [boleta, setBoleta] = useState('');
  const [clave, setClave] = useState('');
  const [boletaError, setBoletaError] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ kind: 'idle', msg: '' }); // idle | loading | success | error

  // mostrar / ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);

  // overlay (pantalla flotante)
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayResult, setOverlayResult] = useState(null); // null | 'success' | 'error'

  // refs auxiliares
  const didInitRef = useRef(false);
  const fetchingCaptchaRef = useRef(false);
  const blobUrlRef = useRef(null);

  // ---------- helpers binarios/base64 ----------
  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function byteArrayToBlob(byteArray, mime = 'image/jpeg') {
    return new Blob([new Uint8Array(byteArray)], { type: mime });
  }

  function formatServerError(result) {
    if (!result) return 'Error en la respuesta del servidor.';
    if (Array.isArray(result.detail)) {
      try {
        return result.detail
          .map(d => {
            const loc = Array.isArray(d.loc) ? d.loc.join('.') : String(d.loc);
            const msg = d.msg || JSON.stringify(d);
            return `${loc}: ${msg}`;
          })
          .join(' • ');
      } catch (e) {
        return 'Error en la validación de datos de entrada.';
      }
    }
    if (typeof result.detail === 'string') return result.detail;
    if (result.message) return result.message;
    if (result.error) return String(result.error);
    try {
      return JSON.stringify(result);
    } catch (e) {
      return 'Error desconocido en el servidor.';
    }
  }

  /**
   * Traduce el error del backend a un mensaje claro:
   * - credenciales incorrectas
   * - captcha incorrecto
   * - problema al extraer carreras / error de servidor
   */
  function classifyError(statusCode, result) {
    const rawDetail =
      (result && (result.detail || result.message || result.error)) || '';
    let text = '';

    if (typeof rawDetail === 'string') {
      text = rawDetail.toLowerCase();
    } else {
      try {
        text = JSON.stringify(rawDetail).toLowerCase();
      } catch {
        text = '';
      }
    }

    if (statusCode === 401 || statusCode === 403) {
      if (text.includes('captcha') || text.includes('imagen')) {
        return 'El texto del CAPTCHA es incorrecto. Intenta de nuevo con la nueva imagen.';
      }
      if (
        text.includes('boleta') ||
        text.includes('usuario') ||
        text.includes('credencial') ||
        text.includes('contraseña') ||
        text.includes('clave')
      ) {
        return 'La boleta o la contraseña son incorrectas. Verifícalas e intenta de nuevo.';
      }
      return 'Credenciales inválidas. Revisa tu boleta, contraseña y el CAPTCHA.';
    }

    if (statusCode === 500 || statusCode === 503) {
      if (text.includes('mapa curricular') || text.includes('extraer') || text.includes('saes')) {
        return 'Ocurrió un error al comunicarse con el SAES o al extraer tus carreras y planes. Intenta de nuevo en unos minutos.';
      }
      return 'Ocurrió un error en el servidor al procesar el inicio de sesión. Intenta nuevamente.';
    }

    // Para otros casos, usamos el detalle genérico
    return formatServerError(result);
  }

  /**
   * Procesa la respuesta JSON del backend de /captcha o /captcha/refresh
   * - Actualiza sessionId (muy importante para el backend nuevo)
   * - Actualiza hiddenFields/cookies si vienen
   * - Calcula y asigna la imagen del captcha
   */
  function handleCaptchaJson(data) {
    // 1) Actualizar session_id
    const sid = data.session_id || data.sessionId || null;
    if (sid) {
      try {
        sessionStorage.setItem('saes_sessionId', sid);
      } catch (e) {
        /* noop */
      }
      setSessionId(sid);
    }

    // 2) Compatibilidad: hidden fields y cookies (aunque el backend nuevo los guarda internamente)
    if (data.hidden_fields || data.hiddenFields || data.hidden) {
      try {
        const hf = data.hidden_fields || data.hiddenFields || data.hidden;
        setHiddenFields(hf);
      } catch (e) {
        /* noop */
      }
    }
    if (data.cookies) {
      setCookies(data.cookies);
      try {
        sessionStorage.setItem('saes_cookies', JSON.stringify(data.cookies));
      } catch (e) {
        /* noop */
      }
    }

    // 3) Resolver imagen del captcha
    const base64 =
      data.captcha_base64 ||
      data.captcha ||
      (data.captcha_image && data.captcha_image.base64);
    const src =
      data.captcha_src || (data.captcha_image && data.captcha_image.src);
    const ct =
      data.content_type ||
      (data.captcha_image && data.captcha_image.content_type) ||
      'image/jpeg';
    const byteArray = data.bytes || data.image_bytes || data.byteArray;

    if (base64) {
      setCaptchaSrc(`data:${ct};base64,${base64}`);
      setStatus({ kind: 'idle', msg: '' });
      return;
    }
    if (src) {
      setCaptchaSrc(src);
      setStatus({ kind: 'idle', msg: '' });
      return;
    }
    if (Array.isArray(byteArray) && byteArray.length > 0) {
      const blob = byteArrayToBlob(byteArray, ct);
      if (blobUrlRef.current) {
        try {
          URL.revokeObjectURL(blobUrlRef.current);
        } catch (e) {
          /* noop */
        }
      }
      const u = URL.createObjectURL(blob);
      blobUrlRef.current = u;
      setCaptchaSrc(u);
      setStatus({ kind: 'idle', msg: '' });
      return;
    }

    throw new Error('JSON de captcha sin imagen válida');
  }

  // ---------- init / load / refresh captcha (alineados al backend nuevo) ----------
  async function initSession() {
    if (fetchingCaptchaRef.current) return false;
    fetchingCaptchaRef.current = true;
    setStatus({ kind: 'loading', msg: 'Inicializando sesión...' });

    try {
      const res = await fetch(`${API_BASE}/captcha`);
      const contentType = res.headers.get('Content-Type') || '';

      if (contentType.startsWith('application/json')) {
        const data = await res.json();
        console.log('[captcha/init] JSON ->', data);
        handleCaptchaJson(data);
        return true;
      }

      if (contentType === 'application/octet-stream' || contentType === '') {
        const buffer = await res.arrayBuffer();
        const base64 = arrayBufferToBase64(buffer);
        setCaptchaSrc(`data:image/jpeg;base64,${base64}`);
        setStatus({ kind: 'idle', msg: '' });
        return true;
      }

      const text = await res.text();
      throw new Error('Respuesta inesperada en /captcha: ' + contentType + ' / ' + text.slice(0, 200));
    } catch (err) {
      console.error('[initSession] error:', err);
      setStatus({
        kind: 'error',
        msg: 'No se pudo iniciar la sesión. Intenta recargar.',
      });
      return false;
    } finally {
      fetchingCaptchaRef.current = false;
    }
  }

  async function loadCaptchaForSession(sid) {
    if (fetchingCaptchaRef.current) return false;
    fetchingCaptchaRef.current = true;
    setStatus({ kind: 'loading', msg: 'Cargando CAPTCHA...' });

    try {
      const url = sid
        ? `${API_BASE}/captcha?session_id=${encodeURIComponent(sid)}`
        : `${API_BASE}/captcha`;

      const res = await fetch(url);
      const contentType = res.headers.get('Content-Type') || '';

      if (contentType.startsWith('application/json')) {
        const data = await res.json();
        console.log('[captcha/load] JSON ->', data);
        handleCaptchaJson(data);
        return true;
      }

      if (contentType === 'application/octet-stream' || contentType === '') {
        const buffer = await res.arrayBuffer();
        const base64 = arrayBufferToBase64(buffer);
        setCaptchaSrc(`data:image/jpeg;base64,${base64}`);
        setStatus({ kind: 'idle', msg: '' });
        return true;
      }

      const text = await res.text();
      throw new Error('Respuesta inesperada en /captcha (load): ' + contentType + ' / ' + text.slice(0, 200));
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
    setStatus({ kind: 'loading', msg: 'Actualizando CAPTCHA...' });

    try {
      const url = sessionId
        ? `${API_BASE}/captcha/refresh?session_id=${encodeURIComponent(sessionId)}`
        : `${API_BASE}/captcha/refresh`;

      const res = await fetch(url);
      const contentType = res.headers.get('Content-Type') || '';

      if (contentType.startsWith('application/json')) {
        const data = await res.json();
        console.log('[captcha/refresh] JSON ->', data);
        handleCaptchaJson(data);
      } else if (contentType === 'application/octet-stream' || contentType === '') {
        const buffer = await res.arrayBuffer();
        const base64 = arrayBufferToBase64(buffer);
        setCaptchaSrc(`data:image/jpeg;base64,${base64}`);
        setStatus({ kind: 'idle', msg: '' });
      } else {
        const text = await res.text();
        throw new Error('Respuesta inesperada en /captcha/refresh: ' + contentType + ' / ' + text.slice(0, 200));
      }

      setCaptchaText('');
    } catch (err) {
      console.error('refreshCaptcha error', err);
      setStatus({
        kind: 'error',
        msg: 'No se pudo actualizar el CAPTCHA. Intenta nuevamente.',
      });
    } finally {
      fetchingCaptchaRef.current = false;
    }
  }

  // ---------- submit login ----------
  async function handleSubmit(e) {
    e.preventDefault();
    if (!/^[0-9]{10}$/.test(boleta)) {
      setBoletaError('La boleta debe contener exactamente 10 dígitos.');
      setStatus({ kind: 'error', msg: 'La boleta debe contener exactamente 10 dígitos.' });
      return;
    }

    if (!clave || !captchaText) {
      setStatus({ kind: 'error', msg: 'Completa todos los campos.' });
      return;
    }

    setOverlayVisible(true);
    setOverlayResult(null);
    setLoading(true);
    setStatus({ kind: 'loading', msg: 'Iniciando sesión...' });

    try {
      const payload = {
        session_id: sessionId,
        boleta,
        password: clave,
        captcha_code: captchaText,
      };

      console.log('[login] payload ->', payload);

      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let result = null;
      try {
        result = await res.json();
      } catch {
        result = null;
      }

      console.log('[login] status', res.status, 'result ->', result);

      if (
        res.ok &&
        result &&
        (result.success ||
          result.logged_in ||
          result.status === 'ok' ||
          result.status === 'success')
      ) {
        try {
          sessionStorage.setItem('saes_user_data', JSON.stringify(result));
          const carreras =
            (result.carrera_info && result.carrera_info.carreras) ||
            result.carreras ||
            [];
          sessionStorage.setItem('saes_carreras', JSON.stringify(carreras));
        } catch (e) {
          console.warn(
            'No se pudo almacenar info de carrera en sessionStorage',
            e,
          );
        }

        setStatus({
          kind: 'success',
          msg: result.message || 'Inicio de sesión correcto.',
        });
        setOverlayResult('success');

        setClave('');
        setCaptchaText('');
        sessionStorage.removeItem('saes_cookies');
        setCookies(null);

        setTimeout(() => {
          setOverlayVisible(false);
          setOverlayResult(null);
          navigate('/generator');
        }, 800);
      } else {
        const friendlyMsg = classifyError(res.status, result);
        setStatus({
          kind: 'error',
          msg: friendlyMsg || 'Inicio de sesión fallido.',
        });
        setOverlayResult('error');

        setCaptchaText('');

        setTimeout(() => {
          setOverlayVisible(false);
          setOverlayResult(null);
        }, 1200);

        try {
          await refreshCaptcha();
        } catch (e2) {
          console.error('Error refrescando captcha tras fallo de login', e2);
        }
      }
    } catch (err) {
      console.error('handleSubmit error', err);
      setStatus({
        kind: 'error',
        msg: 'Error de conexión al servidor. Intenta de nuevo.',
      });
      setOverlayResult('error');
      setCaptchaText('');
      setTimeout(() => {
        setOverlayVisible(false);
        setOverlayResult(null);
      }, 1200);
    } finally {
      setLoading(false);
    }
  }

  // ---------- efecto init ----------
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    (async () => {
      if (!sessionId) {
        await initSession();
      } else {
        try {
          await loadCaptchaForSession(sessionId);
        } catch (e) {
          await initSession();
        }
      }
    })();

    return () => {
      if (blobUrlRef.current) {
        try {
          URL.revokeObjectURL(blobUrlRef.current);
        } catch (e) {
          /* noop */
        }
        blobUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showSpinner = loading || status.kind === 'loading';

  function handleBoletaChange(e) {
    const raw = String(e.target.value || '');
    const digits = raw.replace(/\D+/g, '').slice(0, 10);
    setBoleta(digits);
    if (digits.length === 10) {
      setBoletaError('');
    } else if (digits.length > 0) {
      setBoletaError('La boleta debe tener 10 dígitos.');
    } else {
      setBoletaError('');
    }
  }

  const SuccessIcon = () => (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="11"
        stroke="#16a34a"
        strokeWidth="2"
        fill="rgba(22,163,74,0.08)"
      />
      <path
        d="M7 13l3 3 7-7"
        stroke="#16a34a"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const ErrorIcon = () => (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="11"
        stroke="#dc2626"
        strokeWidth="2"
        fill="rgba(220,38,38,0.08)"
      />
      <path
        d="M9 9l6 6M15 9l-6 6"
        stroke="#dc2626"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const Spinner = () => <div className="spinner" />;

  // ---------- JSX ----------
  return (
    <div className="login-page">
      <div className="split">
        <aside className="left-panel" aria-hidden="true" />

        <div className="divider" />

        <section className="right-panel">
          <div className="card title-card">
            <h1>Sistema Generador de Horarios Académicos – UPIICSA</h1>
          </div>

          <div
            className="card login-card"
            role="region"
            aria-label="Módulo de acceso"
          >
            <form
              onSubmit={handleSubmit}
              className={`login-form ${overlayVisible ? 'muted' : ''}`}
              autoComplete="off"
            >
              <p className='fw-light'>
                Accede al sistema usando la misma boleta y clave con la que ingresas a tu sesión de SAES.{` `}
                <span
                  className="d-inline-block"
                  tabIndex={0}
                  title="El generador de horarios utiliza tus credenciales para extraer la oferta de unidades de aprendizaje del SAES en tiempo real."
                >
                  (?)
                </span>
              </p>
              <label>
                Número de boleta
                <input
                  type="text"
                  inputMode="numeric"
                  value={boleta}
                  onChange={handleBoletaChange}
                  placeholder="Ej. 2023123456"
                  maxLength={10}
                  pattern="\d{10}"
                  aria-invalid={!!boletaError}
                  title="Solo dígitos, exactamente 10"
                />
                {boletaError && (
                  <div className="field-error" role="alert">
                    {boletaError}
                  </div>
                )}
              </label>

              <label>
                Clave
                <div className="password-row">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={clave}
                    onChange={e => setClave(e.target.value)}
                    placeholder="Tu clave"
                  />
                  <button
                    type="button"
                    className="btn-secondary btn-show-password"
                    onClick={() => setShowPassword(prev => !prev)}
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <a
                  href="https://www.saes.upiicsa.ipn.mx/SendEmail/RecuperaPass.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="forgot-link"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </label>

              <div className="captcha-row">
                <div className="captcha-image-container">
                  {captchaSrc ? (
                    <img
                      src={captchaSrc}
                      alt="Captcha SAES"
                      className="captcha-image"
                    />
                  ) : (
                    <div className="captcha-placeholder">Cargando captcha...</div>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={refreshCaptcha}
                  disabled={fetchingCaptchaRef.current}
                >
                  Refrescar
                </button>
              </div>

              <label>
                Texto del CAPTCHA
                <input
                  type="text"
                  value={captchaText}
                  onChange={e => setCaptchaText(e.target.value)}
                  placeholder="Escribe el texto de la imagen"
                />
              </label>

              <button type="submit" className="btn-primary" disabled={showSpinner}>
                {showSpinner ? (
                  <span className="btn-with-spinner">
                    <Spinner /> Iniciando...
                  </span>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </form>

            <div className={`status ${status.kind}`}>
              {status.msg && <div className="status-msg">{status.msg}</div>}
            </div>
          </div>
        </section>
      </div>

      {overlayVisible && (
        <div className="login-overlay" role="status" aria-live="polite">
          <div className="overlay-content">
            {!overlayResult && (
              <>
                <div className="big-spinner" aria-hidden />
                <div className="overlay-text">Verificando credenciales...</div>
              </>
            )}

            {overlayResult === 'success' && (
              <>
                <SuccessIcon />
                <div className="overlay-text success">Acceso concedido</div>
              </>
            )}

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
