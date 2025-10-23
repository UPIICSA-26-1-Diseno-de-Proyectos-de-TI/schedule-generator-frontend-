
import React, { useEffect } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import './picker.css'
import { useDispatch, useSelector } from 'react-redux';
import { pickSchedule, removeSavedSchedule, setSavedSchedules, switchToGeneratedSchedules, switchToSavedShedules } from '../../../../store/slices/picker/pickerSlice';

const SchedulePicker = () => {
  const dispatch = useDispatch();
  
  const mode = useSelector(state => state.picker.mode);
  const data = useSelector(state => state.picker.schedules);
  const savedSchedules = useSelector(state => state.picker.savedSchedules)
  const selectedSchedule= useSelector(state => state.picker.schedulePicked);

  useEffect(() => {

    const storedSchedules = JSON.parse(localStorage.getItem('StoredSchedules'));
    if (storedSchedules) {
      dispatch(setSavedSchedules(storedSchedules));
    }
  }, [dispatch]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem('StoredSchedules', JSON.stringify(savedSchedules));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [savedSchedules]);

  const handleScheduleSelect = (schedule) => {
    dispatch( pickSchedule(schedule) );
  };

  const handleDeleteSchedule = (item) => {
    dispatch( removeSavedSchedule(item) );
    dispatch( switchToSavedShedules() );
  }

  return (
    <div className='card shadow-sm'>
      <div className='card-body'>
        <div className='d-flex justify-content-between mb-0 pb-0'>
          {mode === 'generated' ? (<p className='card-title text-left fw-medium fs-5'>Horarios generados</p>) : 
          (<p className='card-title text-left fw-medium fs-5'>Horarios guardados</p>)
          }
          <div className=''>
            <input type="radio" className="btn-check" name="options-outlined" id="success-outlined" autoComplete="off" checked={mode === 'generated' ? true : false} onChange={() => dispatch(switchToGeneratedSchedules())}/>
            <label className="btn btn-outline-success rounded-0 border-end-0" htmlFor="success-outlined">Generados</label>
            <input type="radio" className="btn-check" name="options-outlined" id="primary-outlined" autoComplete="off" checked={mode === 'saved' ? true : false} onChange={() => dispatch(switchToSavedShedules())}/>
            <label className="btn btn-outline-primary rounded-0 border-start-0" htmlFor="primary-outlined">Guardados</label>
          </div>
        </div>
        <hr className='w-50 text-white-50 bg-dark shadow-sm mt-0' />
        {data.length === 0 ? (
          <div className='text-center text-body-secondary'>
            <p><i className="bi bi-archive h1"></i></p>
            {mode === 'generated' ? (
              <h2>No se ha generado ningun horario</h2>
            ) : (<h2>No hay horarios guardados</h2>)
            }
          </div>
        ) : (
          <div className="card-group overflow-auto">
            <div className="opciones-scroll">
              {data.map((item, index) => ( <div className={`card opcion shadow-sm ${selectedSchedule === item ? 'selected': ''}`} key={index}>
                <div className='opcion-content' onClick={() => handleScheduleSelect(item)}>
                  {index + 1}
                </div>
                {
                  mode === 'saved' && (
                  <p className="btn btn-danger btn-sm opcion-delete m-1" onClick={() => handleDeleteSchedule(item)}>
                    X
                  </p>

                  )
                }
              </div>
            ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SchedulePicker