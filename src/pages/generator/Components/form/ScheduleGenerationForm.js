// src/pages/generator/Components/form/ScheduleGenerationForm.js
import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./form.css";
import { useDispatch, useSelector } from "react-redux";
import {
  addSemester,
  changeEndTime,
  changeStartTime,
  removeSemester,
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
    isGenerating: loading,
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
      dispatch(removeSemester(v));
    } else {
      dispatch(addSemester(v));
    }
  };

  const handlePlanChange = (e) => {
    const value = e.target.value;

    const plans = career?.planes || [];
    const plan = plans.find((p) => String(p.value) === String(value)) || null;
    setSelectedPlan(plan);

    // IMPORTANTE: al cambiar de plan, limpiamos los semestres seleccionados
    if (Array.isArray(semesters) && semesters.length > 0) {
      semesters.forEach((s) => dispatch(removeSemester(s)));
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
    };

    dispatch(getSchedules(params));
  };

  const getPlanLabel = (plan) => {
    if (!plan) return "";
    return plan.text || plan.nombre || `Plan ${plan.value || ""}`;
  };

  const planOptions = career?.planes || [];
  const periodOptions = selectedPlan?.periodos || [];

  return (
    <div className="card shadow-sm px-3 py-0 h-100">
      {/* Selector de carrera */}
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

      <div className="card-body px-2 py-3">
        <h4 className="card-title text-center mb-3">Ajustes</h4>
        <hr className="mb-4 mt-0" />

        <form onSubmit={handleSubmit}>
          {/* Botón para re-seleccionar carrera */}
          <div className="mb-3 d-flex justify-content-center">
            <button
              type="button"
              className="btn btn-outline-primary w-100"
              onClick={() => {
                const event = new CustomEvent("open-career-selector");
                window.dispatchEvent(event);
              }}
            >
              Volver a Seleccionar carrera
            </button>
          </div>

          {/* Plan de estudio */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Plan de estudio:</label>
            <select
              className="form-select"
              value={selectedPlan?.value || ""}
              onChange={handlePlanChange}
              disabled={!planOptions.length}
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
              {periodOptions.length ? (
                periodOptions.map((p) => {
                  const val = String(p.value);
                  const checked = semesters.map(String).includes(val);
                  return (
                    <div className="form-check me-3" key={val}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`period-${val}`}
                        checked={checked}
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
                onChange={(e) => handleTimeChange(e, "start")}
              />
              <span className="mx-1">–</span>
              <input
                type="time"
                className="form-control"
                value={endTime}
                onChange={(e) => handleTimeChange(e, "end")}
              />
            </div>
          </div>

          {/* Botones de exclusión / materias */}
          <div className="mb-3 d-grid gap-2">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => setExcludedTeachersModalOpen(true)}
            >
              Excluir profesores
            </button>
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => setExcludedSubjectModalOpen(true)}
            >
              Excluir asignaturas
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setRequiredSubjectsModalOpen(true)}
            >
              Asignaturas obligatorias
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setExtraSubjectsModalOpen(true)}
            >
              Asignaturas extra
            </button>
          </div>

          {/* Mensaje de error */}
          {formError && (
            <div className="alert alert-warning py-2" role="alert">
              {formError}
            </div>
          )}

          {/* Botón Generar */}
          <div className="mt-4 d-grid">
            <button
              type="submit"
              className="btn btn-success btn-lg"
              disabled={loading}
            >
              {loading ? "Generando horarios..." : "Generar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleGenerationForm;
