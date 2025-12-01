import React, { useEffect, useState } from 'react';
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

  // Estado para confirmar eliminación de horarios guardados
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Índice del horario seleccionado (solo para color / estilo)
  const [selectedIndex, setSelectedIndex] = useState(null);

  const mode = useSelector((state) => state.picker.mode);
  const selectedSchedule = useSelector((state) => state.picker.selectedSchedule);
  const schedules = useSelector((state) => state.picker.schedules);
  const savedSchedules = useSelector((state) => state.picker.savedSchedules);

  // -------------------------
  // CARGAR HORARIOS GUARDADOS DESDE localStorage
  // -------------------------
  useEffect(() => {
    try {
      const stored = localStorage.getItem('saved_schedules');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          dispatch(setSavedSchedules(parsed));
        }
      }
    } catch (error) {
      console.error('[SchedulePicker] Error leyendo localStorage:', error);
    }
  }, [dispatch]);

  // -------------------------
  // GUARDAR HORARIOS EN localStorage CUANDO CAMBIAN
  // -------------------------
  useEffect(() => {
    try {
      if (Array.isArray(savedSchedules)) {
        localStorage.setItem('saved_schedules', JSON.stringify(savedSchedules));
      } else {
        localStorage.removeItem('saved_schedules');
      }
    } catch (error) {
      console.error('[SchedulePicker] Error guardando en localStorage:', error);
    }
  }, [savedSchedules]);

  // -------------------------
  // SELECCIONAR UN HORARIO
  // -------------------------
  const handleScheduleSelect = (schedule, index) => {
    if (!schedule) {
      console.warn('[SchedulePicker] Se intentó seleccionar un horario vacío');
      return;
    }
    setSelectedIndex(index);          // solo para mantener el color de selección
    dispatch(pickSchedule(schedule)); // lógica original intacta
  };

  // -------------------------
  // BORRAR UN HORARIO GUARDADO (con confirmación)
  // -------------------------
  const handleDeleteSchedule = (item) => {
    setScheduleToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDeleteSchedule = () => {
    if (scheduleToDelete) {
      dispatch(removeSavedSchedule(scheduleToDelete));
      dispatch(switchToSavedShedules());
    }
    setScheduleToDelete(null);
    setShowDeleteModal(false);
  };

  const cancelDeleteSchedule = () => {
    setScheduleToDelete(null);
    setShowDeleteModal(false);
  };

  // -------------------------
  // MENSAJE SI NO HAY HORARIOS
  // -------------------------
  const renderEmptyMessage = () => {
    if (mode === 'generated') {
      return (
        <div className="text-center text-muted py-3">
          <h4 className="fs-6 fw-semibold">No hay horario seleccionado todavía.</h4>
          <p className="mb-1">Genera horarios y elige uno en la parte superior.</p>
        </div>
      );
    }

    return (
      <div className="text-center text-muted py-3">
        <h4 className="fs-6 fw-semibold">No tienes horarios guardados.</h4>
        <p className="mb-1">Selecciona un horario generado y guárdalo para verlo aquí.</p>
      </div>
    );
  };

  // -------------------------
  // DATOS SEGÚN MODO (generados / guardados)
  // -------------------------
  const data = mode === 'generated' ? schedules : savedSchedules;

  // -------------------------
  // RENDER PRINCIPAL
  // -------------------------
  return (
    <React.Fragment>
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
                onChange={() => {
                  setSelectedIndex(null); // al cambiar de pestaña quitamos selección visual
                  dispatch(switchToGeneratedSchedules());
                }}
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
                onChange={() => {
                  setSelectedIndex(null);
                  dispatch(switchToSavedShedules());
                }}
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
                    className={`card opcion shadow-sm ${selectedIndex === index ? 'selected' : ''}`}
                    key={index}
                    onClick={() => handleScheduleSelect(item, index)}
                  >
                    <div className="opcion-content">
                      {index + 1}
                    </div>

                    {/* Botón de eliminar SOLO para guardados */}
                    {mode === 'saved' && (
                      <p
                        className="btn btn-danger btn-sm opcion-delete m-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSchedule(item);
                        }}
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

      {showDeleteModal && (
        <div
          className="modal fade show"
          style={{
            display: 'block',
            backgroundColor: 'rgba(0,0,0,0.45)',
          }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Eliminar horario guardado</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={cancelDeleteSchedule}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  ¿Estás seguro de que quieres eliminar este horario guardado?
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelDeleteSchedule}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDeleteSchedule}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default SchedulePicker;
