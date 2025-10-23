import React, { useEffect, useRef } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import Schedule from './schedule/Schedule'
import { useDispatch, useSelector } from 'react-redux';
import { displaySchedule } from '../../../../store/slices/viwer/viwerSlice';
import { useReactToPrint } from 'react-to-print';
import { addSavedSchedule } from '../../../../store/slices/picker/pickerSlice';

const ScheduleViwer = () => {
  const dispatch = useDispatch();
  const schedulePicked = useSelector(state => state.picker.schedulePicked);
  const displayedSchedule = useSelector(state => state.viwer.displayedSchedule);
  
  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current
  });
  
  const handleSave = () => {
    if (displayedSchedule) {
      dispatch(addSavedSchedule(displayedSchedule));
    }
  }

  useEffect(() => {
    dispatch( displaySchedule( schedulePicked ) );
  }, [schedulePicked, dispatch]);
  
  return (
    <div className='card w-100 h-100'>
      <div className='card-body p-2 h-100'>
          <div className='row'>
            <div className='d-flex px-5 align-items-center'>
              <div className='w-100'>
                <p className='fs-4 text-center mt-1  mb-1 fw-medium'>Horario</p>
              </div>
              <div className='d-flex'>
                <button className='btn btn-outline-primary mx-1' onClick={handlePrint} data-toggle="tooltip" data-placement="bottom" title="Imprimir">
                  <i className="bi bi-printer fw-medium"></i>
                </button>
                <button className='btn btn-outline-primary mx-1' onClick={handleSave} data-toggle="tooltip" data-placement="bottom" title="Guardar horario">
                  <i className="bi bi-floppy fw-medium"></i>
                </button>
              </div>
            </div>
            <hr className='mb-3 mt-1 text-gray-100 bg-dark shadow-sm' style={{width: '85%', margin: '0 auto'}}/>
          </div>
          <div className='row'>
              <Schedule selectedSchedule={displayedSchedule} ref={componentRef}/>
          </div>
          <div className='row text-end w-100'>
            <div className='col-12'>
              <span className='d-inline'>
                {displayedSchedule ? <p>Popularidad: {displayedSchedule.avg_positive_score.toFixed(4)} | Total de creditos requerido: {displayedSchedule.total_credits_required}</p>
                : <p>Popularidad: 0.0000 | Total de creditos requerido: 0</p>}
              </span>
            </div>
          </div>

      </div>
    </div>
  )
}

export default ScheduleViwer