// src/pages/generator/Components/picker/ScheduleGenerationForm.jsx
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './form.css';
import { useDispatch, useSelector } from 'react-redux';
import {
  addSemester,
  changeEndTime,
  changeStartTime,
  removeSemester
} from '../../../../store/slices/form/formSlice';
import { getSchedules } from '../../../../store/slices/form/thunks';
import CareerSelector from './components/CareerSelector';
import TeacherExcluder from './components/TeacherExcluder';
import SubjectExcluder from './components/SubjectExcluder';
import ExtraSubjectsProvider from './components/ExtraSubjectsProvider';
import RequiredSubjectsProvider from './components/RequiredSubjectsProvider';

const ScheduleGenerationForm = () => {
  const dispatch = useDispatch();

  // datos globales del store
  const career = useSelector(state => state.form.career);
  const semesters = useSelector(state => state.form.semesters);
  const startTime = useSelector(state => state.form.startTime);
  const endTime = useSelector(state => state.form.endTime);
  const excludedTeachers = useSelector(state => state.form.excludedTeachers);
  const excludedSubjects = useSelector(state => state.form.excludedSubjects);
  const extraSubjects = useSelector(state => state.form.extraSubjects);
  const requiredSubjects = useSelector(state => state.form.requiredSubjects);
  const loading = useSelector(state => state.form.isGenerating);

  // UI modals
  const [excludedTeachersModalOpen, setExcludedTeachersModalOpen] = useState(false);
  const [excludedSubjectModalOpen, setExcludedSubjectModalOpen] = useState(false);
  const [extraSubjectsModalOpen, setExtraSubjectsModalOpen] = useState(false);
  const [requiredSubjectsModalOpen, setRequiredSubjectsModalOpen] = useState(false);

  // Local state: plan seleccionado (value) y objeto del plan
  const [selectedPlanValue, setSelectedPlanValue] = useState('');
  const [selectedPlanObj, setSelectedPlanObj] = useState(null);

  // Al cambiar de carrera, limpiar plan y semestres en store
  useEffect(() => {
    setSelectedPlanValue('');
    setSelectedPlanObj(null);
    if (Array.isArray(semesters) && semesters.length > 0) {
      semesters.forEach(s => dispatch(removeSemester(s)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [career]);

  const handlePlanChange = (e) => {
    const value = e.target.value;
    // limpiar semestres actuales en el store
    if (Array.isArray(semesters) && semesters.length > 0) {
      semesters.forEach(s => dispatch(removeSemester(s)));
    }
    setSelectedPlanValue(value);

    // buscar objeto del plan en career.planes (soporte para career.planes)
    if (career && Array.isArray(career.planes)) {
      const planObj = career.planes.find(p => String(p.value) === String(value));
      setSelectedPlanObj(planObj || null);
    } else {
      setSelectedPlanObj(null);
    }
  };

  const handlePeriodCheckbox = (event) => {
    const value = String(event.target.value);
    if (event.target.checked) {
      dispatch(addSemester(value));
    } else {
      dispatch(removeSemester(value));
    }
  };

  const handdleSubmit = (e) => {
    e.preventDefault();
    const params = {
      // básicos que envía el form: adaptalos si tu backend requiere otros campos
      semesters,
      startTime,
      endTime,
      career,
      excludedTeachers,
      excludedSubjects,
      extraSubjects,
      requiredSubjects
    };
    dispatch(getSchedules(params));
  };

  const getPlanLabel = (plan) => {
    if (!plan) return '';
    return plan.text || plan.nombre || `Plan ${plan.value || ''}`;
  };

  return (
    <div className="card shadow-sm px-3 py-0 h-100">
      <CareerSelector />
      <TeacherExcluder isOpen={excludedTeachersModalOpen} setIsOpen={setExcludedTeachersModalOpen} />
      <SubjectExcluder isOpen={excludedSubjectModalOpen} setIsOpen={setExcludedSubjectModalOpen} />
      <ExtraSubjectsProvider isOpen={extraSubjectsModalOpen} setIsOpen={setExtraSubjectsModalOpen} />
      <RequiredSubjectsProvider isOpen={requiredSubjectsModalOpen} setIsOpen={setRequiredSubjectsModalOpen} />

      <div className="card-body pt-1">
        <div className='position-relative'>
          <p className='fs-4 text-center mt-2 mb-1 fw-medium'>Ajustes</p>
          <hr className='mb-3 mt-1 text-gray-100 bg-dark shadow-sm w-90' />
        </div>

        <form className="d-flex flex-column justify-content-between" onSubmit={handdleSubmit}>

          {/* SELECTOR DE PLAN (dinámico) */}
          <div className="form-group my-1">
            <button type="button" className="btn btn-outline-primary" onClick={() => window.location.reload()}>Volver a Seleccionar carrera</button>
            <label className='fs-6 fw-medium mb-1'>Plan de estudio:</label>
            <div>
              {career && Array.isArray(career.planes) && career.planes.length > 0 ? (
                <select
                  className="form-control form-control-sm"
                  value={selectedPlanValue}
                  onChange={handlePlanChange}
                  aria-label="Selecciona el plan de estudios"
                >
                  <option value="">-- Selecciona un plan --</option>
                  {career.planes.map((p) => (
                    <option key={String(p.value)} value={String(p.value)}>{getPlanLabel(p)}</option>
                  ))}
                </select>
              ) : (
                <div className="text-muted">No hay planes disponibles para la carrera seleccionada. Selecciona una carrera primero.</div>
              )}
            </div>
          </div>

          {/* CHECKBOXES DE PERIODOS (semestres) según plan.periodos */}
          {selectedPlanObj && Array.isArray(selectedPlanObj.periodos) && selectedPlanObj.periodos.length > 0 ? (
            <div className="form-group my-1">
              <label className='fs-6 fw-medium mb-1'>Semestres / periodos disponibles:</label>
              <div>
                {selectedPlanObj.periodos.map((period) => {
                  const semValue = String(period.value);
                  const semText = period.text ?? period.value;
                  return (
                    <div key={semValue} className="form-check form-check-inline">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`plan-${selectedPlanValue}-periodo-${semValue}`}
                        name="semestres"
                        value={semValue}
                        onChange={handlePeriodCheckbox}
                        checked={Array.isArray(semesters) ? semesters.map(String).includes(semValue) : false}
                      />
                      <label className="form-check-label" htmlFor={`plan-${selectedPlanValue}-periodo-${semValue}`}>
                        {semText}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="form-group my-1">
              <label className='fs-6 fw-medium mb-1'>Semestre al que perteneces:</label>
              <div className="text-muted">Selecciona un plan para ver los periodos (semestres) disponibles.</div>
            </div>
          )}

          {/* HORA DE INICIO / FIN */}
          <div className="form-group my-1">
            <label className='fs-6 fw-medium mb-1'>Hora deseada de inicio y fin de clases:</label>
            <div className="d-flex justify-content-between py-0 my-0">
              <input
                title="Hora de entrada"
                type="time"
                min="07:00:00"
                max="22:00:00"
                className="form-control my-0 py-0 text-center"
                name="horaInicio"
                value={startTime}
                onChange={(e) => dispatch(changeStartTime(e.target.value))}
                style={{ height: '35px' }}
              />
              <div className=''>
                <p className='mx-1 fw font-monospace fs-4 py-0 my-0'> - </p>
              </div>
              <input
                title="Hora de salida"
                type="time"
                min="07:00:00"
                max="22:00:00"
                className="form-control my-0 py-0 text-center"
                name="horaFin"
                value={endTime}
                onChange={(e) => dispatch(changeEndTime(e.target.value))}
                style={{ height: '35px' }}
              />
            </div>
          </div>

          {/* BOTONES DE MODALES */}
          <div className="form-group my-1 d-grid mt-3">
            <button type="button" className="btn btn-outline-primary" onClick={() => { setExcludedTeachersModalOpen(true); }} title="Excluir profesores">
              Excluir profesores
            </button>
          </div>

          <div className="form-group my-1 d-grid mt-3">
            <button type="button" className="btn btn-outline-primary" onClick={() => { setExcludedSubjectModalOpen(true); }} title="Excluir asignaturas">
              Excluir asignaturas
            </button>
          </div>

          {/* BOTÓN GENERAR */}
          <div className='d-grid mt-3'>
            <hr />
            <button type="submit" className="btn btn-outline-success btn-lg " title="Generar todos los horarios">
              Generar
            </button>
          </div>

        </form>

        {loading && (
          <div className="modal" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255, 255, 255, 0.8)', justifyContent: 'center', alignItems: 'center' }}>
            <div className="loading-spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleGenerationForm;
