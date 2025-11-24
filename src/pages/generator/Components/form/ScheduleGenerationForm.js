// src/pages/generator/Components/form/ScheduleGenerationForm.js
import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./form.css";
import { useDispatch, useSelector } from "react-redux";
import {
  addSemester,
  changeEndTime,
  changeStartTime,
  clearGenerationSummary,
} from "../../../../store/slices/form/formSlice";
import { getSchedules } from "../../../../store/slices/form/thunks";
import CareerSelector from "./components/CareerSelector";
import TeacherExcluder from "./components/TeacherExcluder";
import SubjectExcluder from "./components/SubjectExcluder";
import ExtraSubjectsProvider from "./components/ExtraSubjectsProvider";
import RequiredSubjectsProvider from "./components/RequiredSubjectsProvider";

const ScheduleGenerationForm = () => {
  const dispatch = useDispatch();

  const {
    semesters,
    startTime,
    endTime,
    career,
    excludedTeachers,
    excludedSubjects,
    extraSubjects,
    requiredSubjects,
    courseLength,
    credits,
    isGenerating: loading,
    generationSummary,
  } = useSelector((state) => state.form);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [excludedTeachersModalOpen, setExcludedTeachersModalOpen] =
    useState(false);
  const [excludedSubjectModalOpen, setExcludedSubjectModalOpen] =
    useState(false);
  const [extraSubjectsModalOpen, setExtraSubjectsModalOpen] = useState(false);
  const [requiredSubjectsModalOpen, setRequiredSubjectsModalOpen] =
    useState(false);

  const [formError, setFormError] = useState("");

  // --- progreso visual continuo ---
  const [showProgress, setShowProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(0); // 0–100
  const [progressLabel, setProgressLabel] = useState("");
  const progressTimerRef = useRef(null);
  const wasGeneratingRef = useRef(false);

  // --- modal de resumen (éxito / fallo) ---
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);

  // Cuando cambia la carrera, si no hay plan seleccionado, tomamos el primero
  useEffect(() => {
    if (career && Array.isArray(career.planes) && career.planes.length > 0) {
      setSelectedPlan((prev) => prev || career.planes[0]);
    } else {
      setSelectedPlan(null);
    }
  }, [career]);

  const handleTimeChange = (e, type) => {
    const value = e.target.value;
    if (type === "start") {
      dispatch(changeStartTime(value));
    } else {
      dispatch(changeEndTime(value));
    }
  };

  const handleSemesterToggle = (value) => {
    const v = String(value);
    if (semesters.map(String).includes(v)) {
      // eliminar semestre
      dispatch({ type: "form/removeSemester", payload: v });
    } else {
      dispatch(addSemester(v));
    }
  };

  const handlePlanChange = (e) => {
    const value = e.target.value;

    const plans = career?.planes || [];
    const plan = plans.find((p) => String(p.value) === String(value)) || null;
    setSelectedPlan(plan);

    // Al cambiar de plan, limpiamos semestres seleccionados
    if (Array.isArray(semesters) && semesters.length > 0) {
      semesters.forEach((s) =>
        dispatch({ type: "form/removeSemester", payload: s })
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    if (!career) {
      setFormError(
        "Primero selecciona una carrera (desde el login y el selector)."
      );
      return;
    }

    if (!selectedPlan) {
      setFormError("Selecciona un plan de estudios.");
      return;
    }

    if (!Array.isArray(semesters) || semesters.length === 0) {
      setFormError("Selecciona al menos un semestre / periodo disponible.");
      return;
    }

    const params = {
      semesters,
      startTime,
      endTime,
      career,
      excludedTeachers,
      excludedSubjects,
      extraSubjects,
      requiredSubjects,
      courseLength,
      credits,
    };

    dispatch(getSchedules(params));
  };

  const getPlanLabel = (plan) => {
    if (!plan) return "";
    return plan.text || plan.nombre || `Plan ${plan.value || ""}`;
  };

  const planOptions = career?.planes || [];

  // --- etiqueta para "Carrera seleccionada" ---
  const selectedCareerName = (() => {
    if (!career) return "";
    return (
      career.text ||
      career.nombre ||
      career.name ||
      career.descripcion ||
      `Carrera ${career.value || career.codigo || ""}`
    );
  })();

  // --------------------------------------------------
  // PROGRESO CONTINUO: se anima mientras isGenerating
  // --------------------------------------------------
  useEffect(() => {
    // cuando empieza la generación
    if (loading && !wasGeneratingRef.current) {
      wasGeneratingRef.current = true;
      setShowProgress(true);
      setProgressValue(0);
      setProgressLabel("Descargando cursos desde SAES...");

      // intervalo que avanza suavemente hasta ~90%
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      progressTimerRef.current = setInterval(() => {
        setProgressValue((prev) => {
          const next = prev + 1.5; // velocidad
          // no pasar de 90 mientras siga en loading
          return next >= 90 ? 90 : next;
        });
      }, 120);
    }

    // cuando termina la generación
    if (!loading && wasGeneratingRef.current) {
      wasGeneratingRef.current = false;
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      // completar a 100% y ocultar después de un pequeño delay
      setProgressValue(100);
      setProgressLabel("Listo. Procesando resultados...");

      setTimeout(() => {
        setShowProgress(false);
        setProgressValue(0);
        setProgressLabel("");
      }, 700);

      // abrir modal de resumen si hay información
      if (generationSummary) {
        setSummaryModalOpen(true);
      }
    }

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [loading, generationSummary]);

  // Actualizar texto de progreso según avance
  useEffect(() => {
    if (!showProgress) return;
    if (progressValue < 25) {
      setProgressLabel("Descargando cursos desde SAES...");
    } else if (progressValue < 55) {
      setProgressLabel("Analizando combinaciones posibles...");
    } else if (progressValue < 85) {
      setProgressLabel("Armando horarios que cumplan tus filtros...");
    } else if (progressValue < 100) {
      setProgressLabel("Finalizando generación de horarios...");
    }
  }, [progressValue, showProgress]);

  // --------- helpers para el modal de resumen ----------

  const closeSummaryModal = () => {
    setSummaryModalOpen(false);
    dispatch(clearGenerationSummary());
  };

  const renderSummaryTitle = () => {
    if (!generationSummary) return "Resultado de la generación";

    if (generationSummary.success) {
      const n =
        typeof generationSummary.count === "number"
          ? generationSummary.count
          : 0;
      return n > 0
        ? `Se generaron ${n} horarios válidos`
        : "Generación completada";
    }
    return "No se pudieron generar horarios con los parámetros actuales";
  };

  const renderSummaryBody = () => {
    if (!generationSummary) return null;

    const { success, count, reasons, suggestions } = generationSummary;

    if (success) {
      return (
        <div>
          <p className="mb-2">
            Se generaron <strong>{count}</strong> horarios que cumplen tus
            filtros. Revísalos en el panel derecho y elige el que más te
            convenga.
          </p>
          {Array.isArray(suggestions) && suggestions.length > 0 && (
            <>
              <p className="mb-1 fw-semibold">
                ¿Quieres explorar otras combinaciones?
              </p>
              <ul className="mb-2">
                {suggestions.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      );
    }

    // Caso sin horarios / error
    return (
      <div>
        {Array.isArray(reasons) && reasons.length > 0 && (
          <>
            <p className="mb-1 fw-semibold">Posibles motivos:</p>
            <ul className="mb-2">
              {reasons.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </>
        )}

        {Array.isArray(suggestions) && suggestions.length > 0 && (
          <>
            <p className="mb-1 fw-semibold">Prueba con estas opciones:</p>
            <ul className="mb-0">
              {suggestions.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </>
        )}

        {!reasons?.length && !suggestions?.length && (
          <p className="mb-0 text-muted">
            Ajusta el número de materias, créditos, rango horario o exclusiones
            y vuelve a intentar.
          </p>
        )}
      </div>
    );
  };

  const planPeriodos = selectedPlan?.periodos || [];

  return (
    <>
      {/* Modal de selección de carrera */}
      <CareerSelector />

      {/* Modales de exclusión / materias */}
      <TeacherExcluder
        isOpen={excludedTeachersModalOpen}
        setIsOpen={setExcludedTeachersModalOpen}
      />
      <SubjectExcluder
        isOpen={excludedSubjectModalOpen}
        setIsOpen={setExcludedSubjectModalOpen}
      />
      <ExtraSubjectsProvider
        isOpen={extraSubjectsModalOpen}
        setIsOpen={setExtraSubjectsModalOpen}
      />
      <RequiredSubjectsProvider
        isOpen={requiredSubjectsModalOpen}
        setIsOpen={setRequiredSubjectsModalOpen}
      />

      <div className="card shadow-sm px-3 py-0 h-100">
        <div className="card-body px-2 py-3">
          <h4 className="card-title text-center mb-3">Ajustes</h4>
          <hr className="mb-3 mt-0" />

          <form onSubmit={handleSubmit}>
            {/* Botón para re-seleccionar carrera */}
            <div className="mb-3 d-flex justify-content-center">
              <button
                type="button"
                className="btn btn-outline-primary w-100"
                onClick={() => {
                  // limpiamos carrera guardada y pedimos seleccionar otra
                  sessionStorage.removeItem("saes_carrera_selected");
                  const ev = new CustomEvent("open-career-selector");
                  window.dispatchEvent(ev);
                }}
                disabled={loading}
              >
                Volver a Seleccionar carrera
              </button>
            </div>

            {/* Carrera seleccionada (solo lectura) */}
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Carrera seleccionada:
              </label>
              <input
                type="text"
                className="form-control"
                value={selectedCareerName}
                readOnly
              />
            </div>

            {/* Plan de estudio */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Plan de estudio:</label>
              <select
                className="form-select"
                value={selectedPlan?.value || ""}
                onChange={handlePlanChange}
                disabled={!planOptions.length || loading}
              >
                <option value="">Selecciona un plan</option>
                {planOptions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {getPlanLabel(p)}
                  </option>
                ))}
              </select>
            </div>

            {/* Semestres / periodos */}
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Semestres / periodos disponibles:
              </label>
              <div className="d-flex flex-wrap gap-2">
                {planPeriodos.length ? (
                  planPeriodos.map((p) => {
                    const val = String(p.value);
                    const checked = semesters.map(String).includes(val);
                    return (
                      <div className="form-check me-3" key={val}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`period-${val}`}
                          checked={checked}
                          disabled={loading}
                          onChange={() => handleSemesterToggle(val)}
                        />
                        <label
                          className="form-check-label"
                          htmlFor={`period-${val}`}
                        >
                          {p.text || val}
                        </label>
                      </div>
                    );
                  })
                ) : (
                  <span>Selecciona primero un plan de estudios.</span>
                )}
              </div>
            </div>

            {/* Rango de horas */}
            <div className="mb-3">
              <label className="form-label fw-semibold d-block">
                Hora deseada de inicio y fin de clases:
              </label>
              <div className="d-flex align-items-center gap-2">
                <input
                  type="time"
                  className="form-control"
                  value={startTime}
                  disabled={loading}
                  onChange={(e) => handleTimeChange(e, "start")}
                />
                <span className="mx-1">–</span>
                <input
                  type="time"
                  className="form-control"
                  value={endTime}
                  disabled={loading}
                  onChange={(e) => handleTimeChange(e, "end")}
                />
              </div>
            </div>

            {/* Número de materias */}
            <div className="mb-3">
              <label className="form-label fw-semibold">
                ¿Cuántas materias quieres en tu horario?
              </label>
              <input
                type="number"
                className="form-control"
                value={courseLength}
                min={1}
                max={15}
                disabled={loading}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (Number.isNaN(v)) return;
                  if (v < 1 || v > 15) return;
                  dispatch({ type: "form/changeCourseLength", payload: v });
                }}
              />
            </div>

            {/* Créditos */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Créditos</label>
              <input
                type="number"
                className="form-control"
                value={credits}
                min={1}
                max={200}
                disabled={loading}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (Number.isNaN(v)) return;
                  if (v < 1 || v > 200) return;
                  dispatch({ type: "form/changeCredits", payload: v });
                }}
              />
            </div>

            {/* Botón Generar */}
            <div className="mt-2 mb-2 d-grid">
              <button
                type="submit"
                className="btn btn-success btn-lg"
                disabled={loading}
              >
                {loading ? "Generando horarios..." : "Generar"}
              </button>
            </div>

            {/* Barra de progreso continua */}
            {showProgress && (
              <div className="mb-3">
                <div
                  className="progress"
                  style={{ height: "8px", backgroundColor: "#e5e7eb" }}
                >
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{ width: `${progressValue}%` }}
                    aria-valuenow={progressValue}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>
                {progressLabel && (
                  <small className="text-muted d-block mt-1">
                    {progressLabel}
                  </small>
                )}
              </div>
            )}

            <hr className="mt-3 mb-2" />
            <p className="text-center text-muted mb-2" style={{ fontSize: 13 }}>
              Después de generar tus horarios, prueba estos filtros:
            </p>

            {/* Botones de exclusión / materias */}
            <div className="mb-3 d-grid gap-2">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => setExcludedTeachersModalOpen(true)}
                disabled={loading}
              >
                Elegir profesores
              </button>

              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => setExcludedSubjectModalOpen(true)}
                disabled={loading}
              >
                Elegir asignaturas
              </button>



              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setRequiredSubjectsModalOpen(true)}
                disabled={loading}
              >
                Asignaturas obligatorias
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setExtraSubjectsModalOpen(true)}
                disabled={loading}
              >
                Asignaturas extra
              </button>
            </div>

            {/* Mensaje de error simple del formulario */}
            {formError && (
              <div className="alert alert-warning py-2" role="alert">
                {formError}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Modal emergente de resumen */}
      {summaryModalOpen && generationSummary && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.45)",
          }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{renderSummaryTitle()}</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={closeSummaryModal}
                />
              </div>
              <div className="modal-body">{renderSummaryBody()}</div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={closeSummaryModal}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ScheduleGenerationForm;
