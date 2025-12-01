# Frontend — Documentación técnica

Última actualización: 2025-11-30

Este documento describe en profundidad la arquitectura, módulos, flujos y prácticas del frontend del proyecto `schedule-generator`.
Está pensado para desarrolladores que deseen entender, mantener o extender la UI.

## Índice

- Resumen general
- Tecnologías y dependencias
- Estructura del repositorio
- Flujo de usuario (alto nivel)
- State management y slices
- Comunicación con el backend (endpoints y thunks)
- Componentes importantes (descripción por archivo)
- Persistencia local (sessionStorage / localStorage)
- Estilos y assets
- Tests
- Build / despliegue / Docker
- Variables de entorno
- Manejo de errores y UX en fallos
- Seguridad y consideraciones operativas
- Recomendaciones y siguientes pasos
- Anexos: comandos útiles y checklist de incorporación

---

## Resumen general

El frontend fue generado con Create React App y utiliza React 18 con Redux Toolkit para el manejo global de estado. Está estructurado como una Single Page Application (SPA) con `HashRouter` de `react-router-dom`.

La experiencia principal: el usuario inicia sesión con credenciales SAES (captcha), selecciona su carrera y plan, ajusta filtros (semestres, horario, número de materias, créditos, exclusiones) y solicita la generación de horarios. El frontend coordina llamadas al backend (endpoints de `/captcha`, `/login`, `/schedules/download` y `/schedules/`) y muestra resultados en dos paneles: un viewer (tabla horaria) y un picker (lista de horarios generados/guardados).

---

## Tecnologías y dependencias (resumen)

Extraído de `package.json`:

- React ^18
- Redux Toolkit (@reduxjs/toolkit)
- React Redux (react-redux)
- React Router DOM ^6
- Axios (peticiones al backend)
- Bootstrap 5 + bootstrap-icons (estilos)
- react-modal (modales accesibles)
- react-to-print (imprimir el horario)
- @testing-library/react, jest-dom, user-event (tests)
- gh-pages (deploy opcional a GitHub Pages)

Dev deps: Babel plugin para propiedades privadas (presente en package.json), redux-mock-store para tests.

---

## Estructura del repositorio (resumen relevante)

Ramas / archivos clave:

- `package.json` — scripts y dependencias
- `Dockerfile`, `nginx.conf` — artefactos de despliegue
- `public/` — `index.html`, manifest, static assets
- `src/`
  - `index.js` — mount y Provider de Redux
  - `App.js` — rutas (HashRouter)
  - `ScheduleGeneratorApp.js` — (archivo vacío en esta versión)
  - `app.css` — estilos globales
  - `pages/`
    - `Login/` — `index.jsx`, estilos (login y captcha)
    - `generator/` — vistas y componentes del generador
      - `Generator.js` — layout principal de las columnas
      - `Components/`
        - `form/` — `ScheduleGenerationForm.js` y componentes (CareerSelector, modales de exclusión, providers)
        - `picker/` — `SchedulePicker.js` (+ tests)
        - `viwer/` — `ScheduleViwer.js`, `schedule/` (`Schedule.js`, `Session.js`, `utils.js`)
    - `homepage/`, `profesor/` — páginas adicionales
  - `store/`
    - `store.js` — configureStore
    - `slices/`
      - `form/` — `formSlice.js`, `thunks.js`
      - `picker/` — `pickerSlice.js`
      - `viwer/` — `viwerSlice.js`

Archivos de test: algunos tests unitarios en `picker` y `viwer`.

---

## Flujo de usuario (normal)

1. Login
   - Componente: `src/pages/Login/index.jsx`
   - Llama a `${REACT_APP_API_ENDPOINT}/captcha` para obtener imagen JSON o bytes del captcha y actualiza `sessionStorage.saes_sessionId`.
   - User envía `boleta`, `clave`, `captcha_text` a `${REACT_APP_API_ENDPOINT}/login`.
   - Si login OK, guarda en sessionStorage: `saes_user_data` y `saes_carreras`, redirige a `/generator`.

2. Selección de carrera
   - Componente: `src/pages/generator/Components/CareerSelector.js` (modal usando `react-modal`).
   - Los datos de carreras se leen desde `sessionStorage.saes_carreras` o `saes_user_data`.
   - Al seleccionar, dispatch `setCareer(c)` al slice `form`.

3. Ajustes / Generación
   - Componente: `src/pages/generator/Components/form/ScheduleGenerationForm.js`.
   - Usuario elige `Plan`, marca `Semestres/periodos`, ajusta `Hora inicio/fin`, `courseLength`, `credits` y abre modales para exclusiones.
   - Submit -> dispatch `getSchedules(params)` (thunk).
   - Feedback: progreso animado; modal emergente con `generationSummary` cuando finaliza.

4. Backend & generación
   - Thunk: `src/store/slices/form/thunks.js`.
   - Flujo: valida inputs, verifica `session_id` en `sessionStorage.saes_user_data`, POST `/schedules/download`, luego POST `/schedules/` con payload normalizado.
   - Actualiza slices en store (`picker` y `form.generationSummary`) según respuesta.

5. Visualización y guardado
   - `SchedulePicker` muestra lista de horarios generados / guardados.
   - `ScheduleViwer` muestra el horario seleccionado en una tabla (`Schedule` + `Session`).
   - Guardado local: `picker.savedSchedules` persiste en `localStorage`.

---

## State management

Se usa Redux Toolkit (slices) y arquitectura clásica unidireccional.

Slices relevantes:

- `form` (archivo: `src/store/slices/form/formSlice.js`)
  - Estado inicial: `semesters`, `startTime`, `endTime`, `career`, `selectedPlan`, `courseLength`, `credits`, `excludedTeachers`, `excludedSubjects`, `extraSubjects`, `requiredSubjects`, `isGenerating`, `generationSummary`.
  - Reducers: cambios de horas, semestres (add/remove), setCareer, setSelectedPlan, start/finish generation, resumen (set/clearGenerationSummary), gestión de exclusiones.

- `picker` (archivo: `src/store/slices/picker/pickerSlice.js`)
  - Maneja: `schedules` (las mostradas), `generatedSchedules`, `savedSchedules`, `schedulePicked`, `mode` (generated / saved).
  - Acciones: setGeneratedSchedules, setSchedules, pickSchedule, addSavedSchedule, removeSavedSchedule, setSavedSchedules, switchToGeneratedSchedules, switchToSavedShedules.

- `viwer` (archivo: `src/store/slices/viwer/viwerSlice.js`)
  - Maneja `displayedSchedule` (lo que realmente muestra el viewer).
  - Acción: `displaySchedule`.

Store está configurado en `src/store/store.js` usando `configureStore` y combinando los reducers.

### Thunks y efectos

- `getSchedules` (en `form/thunks.js`) es la pieza central que coordina llamadas a backend.
  - Limpia el estado previo: resetea `generationSummary`, sets schedules vacíos y switch a generated mode.
  - Normaliza `career`, `semesters`, `length`, `credits`.
  - Valida: aborta con `generationSummary` si faltan `career` o `semesters`.
  - Requiere `session_id` extraído de `sessionStorage.saes_user_data`.
  - POST `/schedules/download` (se espera que prepare/actualice datos del SAES en backend).
  - POST `/schedules/` con payload final y luego dispatch a `picker` con resultados.
  - Construye `generationSummary` con mensajes claros (success / empty / error) y sugerencias.

---

## Comunicación con backend (endpoints, formatos y dependencias)

Variables de entorno: `REACT_APP_API_ENDPOINT` (usada para construir URLs a backend). Debe apuntar al backend que provee `/captcha`, `/login`, `/schedules/download` y `/schedules/`.

Puntos importantes:

- Login & captcha:
  - GET `${API_BASE}/captcha` — devuelve JSON con `session_id` y datos del captcha o imagen bytes.
  - POST `${API_BASE}/login` — payload: { session_id, boleta, password, captcha_code }.
  - Respuesta: `saes_user_data` con estructuras esperadas como `carrera_info.carreras`.

- Schedules:
  - POST `${REACT_APP_API_ENDPOINT}/schedules/download` — payload: { session_id, career, career_plan, plan_period }.
  - POST `${REACT_APP_API_ENDPOINT}/schedules/` — payload: { career, levels, semesters, start_time, end_time, length, credits, available_uses, excluded_teachers, excluded_subjects, required_subjects, extra_subjects, shifts }.
  - Se espera que `/schedules/` devuelva un array de horarios (cada horario con lista de `courses`, `total_credits_required`, `popularity`, etc.).

Errores y códigos manejados por el frontend:
- 422 (validación) — se muestran sugerencias.
- Errores de red y 500 — el thunk crea un summary con sugerencias (reintentar / revisar conexión).
- Ausencia de `session_id` — mensaje que pide re-login.

---

## Componentes principales (descripción por archivo / responsabilidad)

A continuación se enlistan componentes clave y su responsabilidad. Los paths son relativos a `src/`.

- `index.js`
  - Monta React, envuelve la app con `<Provider store={store}>`.

- `App.js`
  - Define rutas con `HashRouter` y `Routes`: `/` → `Login`, `/home` → `HomePage`, `/generator` → `Generator`, `/profesor/:name` → `Profesor`.
  - Observación: usa `Component={Login}` (prop alternativa a `element`), revisar estilo para `react-router-dom` v6.

- `pages/Login/index.jsx`
  - Lógica completa de captcha y login: funciones `initSession`, `loadCaptchaForSession`, `refreshCaptcha`, `handleSubmit`.
  - Valida boleta (10 dígitos) y maneja overlay, mensajes, almacenamiento en `sessionStorage`.

- `pages/generator/Generator.js`
  - Layout de columnas (izquierda: `ScheduleViwer` + `SchedulePicker`; derecha: `ScheduleGenerationForm`).

- `pages/generator/Components/CareerSelector.js`
  - Modal para elegir carrera; carga datos desde `sessionStorage` y dispatch `setCareer`.
  - Styling inline y accesibilidad básica (Modal.setAppElement('#root')).

- `pages/generator/Components/form/ScheduleGenerationForm.js`
  - Formulario principal con: plan select, semestres checkboxes, hora inicio/fin, courseLength, credits, botones para modales de exclusión y generación.
  - Control local de progress (showProgress, progressValue, progressLabel) ligado a `form.isGenerating`.
  - Muestra modal de resumen (`generationSummary`) al terminar.

- `pages/generator/Components/picker/SchedulePicker.js`
  - Lista de horarios generados o guardados; carga `StoredSchedules` desde `localStorage` y persiste en `beforeunload`.
  - Permite seleccionar y eliminar guardados.

- `pages/generator/Components/viwer/ScheduleViwer.js`
  - Muestra el horario seleccionado (usa `displaySchedule`) y botones para imprimir/guardar.

- `pages/generator/Components/viwer/schedule/Schedule.js`
  - Renderiza la tabla horaria: lista de horas, columnas por días, construye sesiones usando `getEventsFromCourses`.

- `pages/generator/Components/viwer/schedule/Session.js`
  - Celda de la tabla para una sesión: muestra materia, secuencia, profesor y lugares.

- Store slices (`src/store/slices/*`)
  - Ver sección State Management.

---

## Persistencia local y claves usadas

Claves en `sessionStorage`:
- `saes_sessionId` — id de sesión devuelto por `/captcha`.
- `saes_user_data` — objeto resultante del login (contiene session_id y `carrera_info`).
- `saes_carreras` — lista de carreras (opcionalmente también leída desde `saes_user_data`).
- `generator_has_career` — marca que indica que el usuario ya seleccionó una carrera (para no forzar modal en visitas subsiguientes).

Claves en `localStorage`:
- `StoredSchedules` — array de horarios guardados por el usuario (usado por `SchedulePicker`).

Recomendación: documentar estos keys en `.env.example` o en README para claridad.

---

## Estilos y assets

- Bootstrap 5 se utiliza para layout principal y utilidades.
- `app.css` y múltiples archivos CSS por componentes (`form.css`, `generator.css`, `generator.layout.css`, `session.css`, `picker.css`, `styles.css` de login).
- Íconos: `bootstrap-icons`.
- React Modal se configura con `Modal.setAppElement('#root')` para accesibilidad.

---

## Tests

- Testing libraries: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`.
- Ejemplo de test: `src/pages/generator/Components/picker/SchedulePicker.test.js` — testa renderizado básico y selección con `redux-mock-store`.

Cobertura actual: pruebas unitarias básicas. No se observan tests para thunks (mock de axios) ni integraciones E2E.

Recomendación: añadir tests para `getSchedules` (mock axios/fetch), así como tests que cubran errores y casos sin resultados.

---

## Build / despliegue / Docker

Scripts en `package.json`:
- `start` — react-scripts start
- `build` — react-scripts build
- `test` — react-scripts test
- `predeploy` / `deploy` — gh-pages

Existen archivos de infraestructura:
- `Dockerfile` (presente en la raíz) — revisar si empaqueta el build y usa `nginx.conf`.
- `nginx.conf` — configuración para servir app estática.

Recomendación: validar que `REACT_APP_API_ENDPOINT` esté configurado via env en entorno de Docker/Nginx.

---

## Variables de entorno (necesarias)

- `REACT_APP_API_ENDPOINT` — URL base del backend (ej: `http://127.0.0.1:8000` o la URL en producción). Se usa desde `thunks.js` y `Login/index.jsx`.

Sugerencia: añadir `.env.example` con:

```
REACT_APP_API_ENDPOINT=http://127.0.0.1:8000
```

Y documentar cómo setearlo en Docker / CI.

---

## Manejo de errores y UX en fallos

- Login:
  - Mensajes claros para 401/403 (credenciales o captcha), 500/503 (problemas de SAES / extracción). Se refresca captcha tras fallo.

- Generación:
  - Si se detecta falta de `session_id`, el thunk devuelve `generationSummary` con mensaje de re-login.
  - Si no se encontraron horarios, se muestran razones y sugerencias (p. ej., reducir materias, ampliar rango horario).
  - En errores de red o validación, el thunk provee sugerencias específicas.

Mejoras sugeridas (UX):
- Añadir botones de acción en el modal de resumen (Reintentar / Reingresar) cuando corresponde.
- Detectar la ausencia de `saes_user_data` y redirigir automáticamente al login con mensaje.

---

## Seguridad y consideraciones operativas

- No exponer datos sensibles en logs (actualmente hay `console.log` en `thunks.js` y en `Login` que podría filtrar estructura de `saes_user_data` o payloads). Recomendación: reducir logs en producción o utilizar un logger con niveles.
- Las credenciales SAES se envían al backend; el frontend no almacena contraseñas en sessionStorage/localStorage.
- Asegurar HTTPS en despliegue para evitar exposición del captcha y credenciales.

---

## Recomendaciones y próximos pasos (priorizadas)

Alta prioridad

1. Manejo de sesión faltante durante generación:
   - Detectar explícitamente ausencia de `session_id` y forzar re-login (e.g., dispatch `setNeedLogin()` o incluir `generationSummary.need_login`).
   - En `ScheduleGenerationForm`, si `generationSummary` indica `need_login`, mostrar botones "Reingresar" y "Reintentar".

2. Unificar fuente de verdad del `selectedPlan`:
   - Eliminar estado local `selectedPlan` en `ScheduleGenerationForm` y usar siempre `state.form.selectedPlan`.

3. Persistencia de `savedSchedules` robusta:
   - Guardar `savedSchedules` en `localStorage` cada vez que cambie (useEffect con dependencia), además de `beforeunload`.

Medio plazo

4. Añadir tests para `getSchedules` con mock de axios y cubrir flujo success / empty / error.
5. Añadir CI (GitHub Actions) que corra `npm ci` y `npm test -- --watchAll=false`.
6. Reemplazar `App.js` para usar `element={<Login/>}` (estandarizar rutas a `react-router-dom` v6 API).

Largo plazo

7. Considerar migración a TypeScript o añadir PropTypes para contratos de componentes.
8. Añadir E2E tests (Cypress/Playwright) para flujos críticos (login -> select career -> generate -> select/save schedule).
9. Documentar `.env.example`, README con pasos locales y Docker Compose para backend+frontend en dev.

---

## Anexos: comandos útiles

Instalar dependencias:

```bash
npm ci
```

Arrancar en desarrollo:

```bash
npm start
# abrir http://localhost:3000
```

Ejecutar tests (modo CI):

```bash
npm test -- --watchAll=false
```

Construir para producción:

```bash
npm run build
```

Deploy (gh-pages configured):

```bash
npm run deploy
```

---

## Checklist de incorporación (para un nuevo desarrollador)

- [ ] Clonar repo y ejecutar `npm ci`.
- [ ] Crear `.env` con `REACT_APP_API_ENDPOINT` apuntando al backend local o de staging.
- [ ] Levantar el backend (o mock endpoints) y probar `/captcha` y `/login` para obtener `saes_user_data`.
- [ ] Ejecutar `npm start` y acceder a `/` para probar login y flujo completo.
- [ ] Ejecutar tests: `npm test`.

---

## Notas finales

Este documento recoge el estado del frontend en la fecha arriba indicada. Para cambios mayores (migración a TypeScript, reorganización de CSS, añadir pruebas E2E, o cambios en la contract API del backend) se recomienda agregar una sección de "Migración" específica con tareas concretas.

Si quieres, puedo:
- añadir un `.env.example` al repositorio;
- implementar automáticamente las mejoras de alta prioridad (detectar falta de sesión y botón Reingresar; persistir `savedSchedules` al cambiar; eliminar `console.log` sensibles);
- o generar tests unitarios para `getSchedules` con mocks de axios.

Indica qué prefieres y procedo con los cambios y pruebas automáticas.
