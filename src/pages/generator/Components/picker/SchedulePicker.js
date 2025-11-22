import React, { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './picker.css';
import { useDispatch, useSelector } from 'react-redux';
import {
  pickSchedule,
  removeSavedSchedule,
  setSavedSchedules,
  switchToGeneratedSchedules,
  switchToSavedShedules
} from '../../../../store/slices/picker/pickerSlice';

const SchedulePicker = () => {
  const dispatch = useDispatch();

  const mode = useSelector((state) => state.picker.mode);
  const data = useSelector((state) => state.picker.schedules || []);
  const savedSchedules = useSelector((state) => state.picker.savedSchedules || []);
  const selectedSchedule = useSelector((state) => state.picker.schedulePicked);

  // -------------------------
  // CARGAR HORARIOS GUARDADOS
  // -------------------------
  useEffect(() => {
    try {
      const storedSchedules = JSON.parse(localStorage.getItem('StoredSchedules'));
      if (storedSchedules && Array.isArray(storedSchedules)) {
        dispatch(setSavedSchedules(storedSchedules));
      }
    } catch (error) {
      console.error('[SchedulePicker] Error al leer localStorage:', error);
    }
  }, [dispatch]);

  // -------------------------
  // GUARDAR HORARIOS EN CACHE
  // -------------------------
  useEffect(() => {
    try {
      const handleBeforeUnload = () => {
        localStorage.setItem('StoredSchedules', JSON.stringify(savedSchedules));
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    } catch (error) {
      console.error("[SchedulePicker] Error guardando en localStorage:", error);
    }
  }, [savedSchedules]);

  // -------------------------
  // SELECCIONAR UN HORARIO
  // -------------------------
  const handleScheduleSelect = (schedule) => {
    if (!schedule) {
      console.warn('[SchedulePicker] Se intentó seleccionar un horario vacío');
      return;
    }
    dispatch(pickSchedule(schedule));
  };

  // -------------------------
  // BORRAR UN HORARIO GUARDADO
  // -------------------------
  const handleDeleteSchedule = (item) => {
    dispatch(removeSavedSchedule(item));
    dispatch(switchToSavedShedules());
  };

  // -------------------------
  // MENSAJE SI NO HAY HORARIOS
  // -------------------------
  const renderEmptyMessage = () => {
    return (
      <div className="text-center text-body-secondary mt-4 mb-4">
        <p><i className="bi bi-archive h1"></i></p>

        {mode === 'generated' ? (
          <>
            <h4>No se encontró ningún horario compatible</h4>
            <p className="mt-2 small">
              • Verifica que seleccionaste <strong>periodos válidos</strong><br />
              • Revisa la <strong>hora de inicio/fin</strong><br />
              • Asegúrate de no excluir profesores/materias esenciales
            </p>
          </>
        ) : (
          <h4>No hay horarios guardados</h4>
        )}
      </div>
    );
  };

  // -------------------------
  // RENDER PRINCIPAL
  // -------------------------
  return (
    <div className="card shadow-sm">
      <div className="card-body">

        {/* HEADER */}
        <div className="d-flex justify-content-between mb-0 pb-0">
          {mode === 'generated'
            ? <p className="card-title text-left fw-medium fs-5">Horarios generados</p>
            : <p className="card-title text-left fw-medium fs-5">Horarios guardados</p>
          }

          <div>
            <input
              type="radio"
              className="btn-check"
              name="options-outlined"
              id="success-outlined"
              autoComplete="off"
              checked={mode === 'generated'}
              onChange={() => dispatch(switchToGeneratedSchedules())}
            />
            <label className="btn btn-outline-success rounded-0 border-end-0" htmlFor="success-outlined">
              Generados
            </label>

            <input
              type="radio"
              className="btn-check"
              name="options-outlined"
              id="primary-outlined"
              autoComplete="off"
              checked={mode === 'saved'}
              onChange={() => dispatch(switchToSavedShedules())}
            />
            <label className="btn btn-outline-primary rounded-0 border-start-0" htmlFor="primary-outlined">
              Guardados
            </label>
          </div>
        </div>

        <hr className="w-50 text-white-50 bg-dark shadow-sm mt-0" />

        {/* SI NO HAY DATOS */}
        {data.length === 0 ? (
          renderEmptyMessage()
        ) : (
          <div className="card-group overflow-auto">
            <div className="opciones-scroll">

              {data.map((item, index) => (
                <div
                  className={`card opcion shadow-sm ${selectedSchedule === item ? 'selected' : ''}`}
                  key={index}
                >
                  <div
                    className="opcion-content"
                    onClick={() => handleScheduleSelect(item)}
                  >
                    {index + 1}
                  </div>

                  {/* Botón de eliminar SOLO para guardados */}
                  {mode === 'saved' && (
                    <p
                      className="btn btn-danger btn-sm opcion-delete m-1"
                      onClick={() => handleDeleteSchedule(item)}
                    >
                      X
                    </p>
                  )}
                </div>
              ))}

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulePicker;
