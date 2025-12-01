# Guía de usuario — Generador de Horarios Académicos (UPIICSA)

Última actualización: 30 de noviembre de 2025

Esta guía está pensada para estudiantes y evaluadores académicos que usarán la aplicación "Sistema Generador de Horarios Académicos – UPIICSA". Explica paso a paso el uso de la aplicación, los controles disponibles, los mensajes posibles, y cómo interpretar y guardar los horarios generados.

Si necesitas añadir capturas de pantalla, coloca la imagen en la carpeta `docs/assets/` y reemplaza el marcador correspondiente: `[IMAGEN: descripción]` por la referencia a la imagen.

---

## Índice

- Introducción
- Requisitos previos
- Arrancar la aplicación
- Pantalla de inicio / Login
- Selección de carrera y plan
- Formulario de generación: campos y recomendaciones
- Proceso de generación y barras de progreso
- Interpretar resultados y usar el visor
- Guardar, recuperar e imprimir horarios
- Mensajes y resolución de problemas (troubleshooting)
- Sugerencias de uso y criterios de entrega académica
- Preguntas frecuentes (FAQ)
- Apéndice: comandos útiles

---

## Introducción

La aplicación permite a estudiantes generar combinaciones de horarios válidas en base a su plan de estudios, semestre(s) y filtros personalizados (horario, exclusiones de profesores o materias, número de materias y créditos). Está pensada para facilitar la búsqueda de horarios factibles sin empalmes.

Esta guía te lleva desde el inicio de sesión hasta la exportación/guardado del horario seleccionado.

---

## Requisitos previos

- Navegador moderno (Chrome, Firefox o Edge) con JavaScript habilitado.
- Conexión a internet para comunicarse con el backend que consulta la oferta SAES.
- Credenciales de SAES (boleta y clave) para iniciar sesión.
- En entornos de desarrollo: tener `REACT_APP_API_ENDPOINT` apuntando al backend.

---

## Arrancar la aplicación (modo desarrollador)

Si estás ejecutando localmente (solo para docentes/QA):

```bash
npm ci
npm start
```

La app estará disponible en `http://localhost:3000`.

[IMAGEN: captura del terminal con npm start y la URL abierta en navegador]

---

## Pantalla de inicio / Login

1. Al abrir la aplicación verás la pantalla de acceso. Debes proporcionar:
   - Número de boleta (10 dígitos).
   - Clave (contraseña de SAES).
   - Texto del CAPTCHA (imagen mostrada en la misma pantalla).

2. El proceso interno:
   - La app solicita un captcha al servidor y guarda una sesión temporal (`session_id`) necesaria para el login.
   - Envías boleta + clave + captcha; el servidor valida y extrae tus carreras/plans desde SAES.

3. Errores comunes en login:
   - Boleta inválida (no tiene 10 dígitos): recibirás un error local antes de enviar.
   - Captcha incorrecto: el sistema te pedirá reintentar y refrescará el captcha.
   - Credenciales inválidas: el backend retornará un error que se mostrará en la pantalla.

4. Si el login es exitoso:
   - Se guardan datos de usuario y carreras en `sessionStorage` para la sesión actual.
   - Serás redirigido automáticamente a la pantalla del generador (`/generator`).

[IMAGEN: pantalla de Login con captcha y overlay de verificación]

---

## Selección de carrera y plan

1. Tras el login, el generador abrirá el modal "Elige tu carrera" si aún no seleccionaste una. En él:
   - Verás tus carreras detectadas (botones con el nombre de la carrera).
   - Selecciona la que corresponda.

2. Tras seleccionar la carrera:
   - El modal se cierra.
   - En el panel derecho (Ajustes) verás la carrera seleccionada y un select con los `Planes de estudio` disponibles.

3. Si necesitas cambiar la carrera en cualquier momento, presiona el botón "Volver a Seleccionar carrera" dentro del formulario: esto reabrirá el selector.

[IMAGEN: modal "Elige tu carrera" mostrando varias opciones]

---

## Formulario de generación: campos y recomendaciones

El formulario principal contiene los ajustes que controlan la generación:

1. Plan de estudio (select)
   - Selecciona el plan al que pertenecen las materias.
   - Al cambiar de plan, los semestres seleccionados se reinician (porque los periodos pueden cambiar entre planes).

2. Semestres / periodos disponibles (checkboxes)
   - Marca al menos un semestre o periodo que quieras considerar.
   - Recomendación: si tu objetivo es cursar varias materias de semestres diferentes (p. ej. 4 y 5), selecciónalos ambos.

3. Hora inicio / Hora fin (inputs tipo time)
   - Define el rango horario en el que aceptas clases.
   - Cuanto más amplio el rango, más posibilidades tendrá el generador.

4. ¿Cuántas materias quieres en tu horario? (courseLength)
   - Número entero entre 1 y 15.
   - Recomendación académica para pruebas: probar con 4-7 materias inicialmente.

5. Créditos
   - Total de créditos objetivo del horario.
   - Ajusta según tu plan y metas.

6. Exclusiones y ajustes avanzados
   - Elegir profesores (excluir ciertos docentes).
   - Elegir asignaturas (excluir materias concretas).
   - Asignaturas obligatorias y Asignaturas extra (forzar inclusión de materias o permitir materias extra).

7. Botones:
   - "Generar": lanza el proceso.
   - "Elegir profesores / asignaturas": abren modales para filtros finos.

[IMAGEN: formulario con plan, semestres, horas y botones de exclusión]

---

## Proceso de generación y barras de progreso

1. Al pulsar "Generar":
   - El frontend valida que haya carrera, plan y al menos un semestre marcado.
   - Si falta algo, verás un mensaje que te lo indicará.

2. Si la validación pasa:
   - La app inicia una petición al backend que consiste en dos pasos: descarga de datos (`/schedules/download`) y luego generación (`/schedules/`).
   - Durante este tiempo verás una barra de progreso animada (indicativa). Mensajes típicos:
     - "Descargando cursos desde SAES..."
     - "Analizando combinaciones posibles..."
     - "Armando horarios que cumplan tus filtros..."
     - "Finalizando generación de horarios..."

3. En caso de éxito:
   - Se abrirá un modal de resumen indicando el número de horarios encontrados y sugerencias para explorar más combinaciones.

4. Si no hay horarios compatibles:
   - Verás un modal con posibles motivos (ej. filtros restrictivos, demasiadas exclusiones, rango horario estrecho) y sugerencias para arreglarlo.

5. Si falla por falta de sesión (session SAES) o error de red:
   - El modal indicará el motivo (ej. "No se encontró la sesión de SAES") y sugerirá reingresar o revisar conexión.

[IMAGEN: barra de progreso y modal de resumen con resultado de la generación]

---

## Interpretar resultados y usar el visor

1. Horarios generados (panel superior izquierdo - Horarios generados)
   - Cada tarjeta numerada es una opción de horario.
   - Haz clic en el número para seleccionar ese horario y verlo en la vista de la derecha.

2. Viewer (panel izquierdo, abajo / principal)
   - Muestra la tabla horaria con días y horas.
   - Cada celda de clase muestra: materia, secuencia, profesor y lugares disponibles.
   - Si hay eventos superpuestos, el generador evita esas combinaciones; los horarios mostrados ya están libres de empalmes.

3. Información adicional
   - En la parte inferior del viewer aparece el total de créditos requeridos por el horario.

[IMAGEN: SchedulePicker mostrando 3 opciones y ScheduleViwer con una tabla de horario]

---

## Guardar, recuperar e imprimir horarios

1. Guardar
   - En la vista del horario (ScheduleViwer) hay un botón "Guardar horario".
   - Al guardarlo, se añadirá a la lista de "Guardados" en el `SchedulePicker`.
   - Los horarios guardados se persisten en `localStorage` y sobreviven recargas del navegador.

2. Recuperar
   - En la parte superior del `SchedulePicker` hay dos modos: "Generados" y "Guardados". Selecciona "Guardados" para ver y cargar tus horarios guardados.

3. Imprimir
   - Usa el botón de impresora en el `ScheduleViwer` para generar una versión imprimible (usa `react-to-print`).

[IMAGEN: vista del viewer con botones Guardar e Imprimir]

---

## Mensajes y resolución de problemas (troubleshooting)

1. "La boleta debe contener exactamente 10 dígitos"
   - Verifica que escribiste solo números y que la longitud es 10.

2. "El texto del CAPTCHA es incorrecto"
   - Refresca el captcha (botón "Refrescar") y vuelve a intentar.

3. "No se encontró la sesión de SAES"
   - Esto significa que la sesión que se obtuvo en el login no está presente (p. ej. cerraste el navegador, expiró la sesión, o abriste otra pestaña sin login).
   - Solución: vuelve a iniciar sesión desde la pantalla principal (ruta `/`).

4. "No se encontraron horarios compatibles"
   - Recomendaciones:
     - Reduce el número de materias solicitadas.
     - Reduce exclusiones de profesores o materias.
     - Selecciona más semestres / periodos si aplica.
     - Amplía el rango horario (Hora fin más tarde / Hora inicio más temprana).

5. Errores de red o 500 del servidor
   - Verifica tu conexión y si el backend está corriendo.
   - Si trabajas localmente, asegúrate de que `REACT_APP_API_ENDPOINT` apunte al backend.

6. Horarios guardados que no aparecen
   - Revisa `localStorage` en las herramientas de desarrollador (clave `StoredSchedules`).
   - En algunos cierres forzados el `beforeunload` podría no ejecutarse; si faltan guardados, revisa la consola de errores.

---

## Sugerencias de uso y criterios para entrega académica

Para una entrega académica (documentar experimentos y resultados), incluye lo siguiente en tu entrega:

1. Información del entorno
   - Versión del navegador y OS.
   - Si corresponde: URL del backend o nota indicando si se usó backend local o mock.

2. Pasos reproducibles
   - Capturas de pantalla o descripción de: login, selección de carrera, plan, semestres, filtros usados, y el horario final seleccionado.
   - Indica los parámetros exactos (start/end time, courseLength, credits, exclusiones aplicadas).

3. Resultados
   - Número de horarios generados.
   - Horario final elegido (adjunta imagen/tabla imprimible).
   - Observaciones sobre si se necesitaron ajustes para obtener un resultado.

4. Evaluación funcional
   - Describe si la app respetó todos los filtros (ej. exclusiones) y si la tabla generada no presenta empalmes.

5. Checklist (para entregar)
   - [ ] Login y extracción de carreras funcionó correctamente.
   - [ ] Se documentaron parámetros usados.
   - [ ] Se incluyeron capturas del horario final.
   - [ ] Se guardó e imprimió el horario (o se explica por qué no fue posible).

---

## Preguntas frecuentes (FAQ)

Q: ¿Puedo generar horarios sin iniciar sesión?

A: No. El sistema requiere iniciar sesión con credenciales SAES para extraer la oferta académica del servidor SAES y mapear las materias de tu plan.

Q: ¿Los horarios guardados están disponibles en otro navegador o dispositivo?

A: No. Los horarios guardados se persisten en `localStorage` del navegador local. Para compartirlos exporta o imprime el horario.

Q: ¿Qué hago si el backend cambia su API?

A: Contacta al equipo responsable y actualiza `REACT_APP_API_ENDPOINT` si la ruta base cambia. Si la estructura de respuesta cambia, puede requerir cambios en los thunks y parsers.

---

## Apéndice: comandos útiles

- Instalar dependencias:

```bash
npm ci
```

- Iniciar en desarrollo:

```bash
npm start
```

- Ejecutar tests:

```bash
npm test
```

- Construir producción:

```bash
npm run build
```

---

## Contacto y soporte

Para dudas técnicas sobre la aplicación o el entorno de ejecución, contacta al equipo docente o al desarrollador encargado del repositorio e incluye:
- URL/commit usado
- Logs relevantes (consola del navegador)
- Capturas de pantalla del error

---

Si quieres, puedo también generar una versión PDF lista para entrega académica (preparando capturas y un índice) o añadir una plantilla de informe en `docs/` que los alumnos puedan completar.
