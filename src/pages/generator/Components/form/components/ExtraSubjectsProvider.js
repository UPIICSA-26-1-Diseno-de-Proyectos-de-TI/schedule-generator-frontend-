import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addExtraSubject, removeExtraSubject } from "../../../../../store/slices/form/formSlice";
import Modal from 'react-modal';

const ExtraSubjectsProvider = ({ isOpen, setIsOpen }) => {
  const dispatch = useDispatch();
  const extraSubjects = useSelector(state => state.form.extraSubjects);
  const career = useSelector(state => state.form.career);

  const [extraSubjectInputName, setExtraSubjectInputName] = useState('');
  const [extraSubjectInputLevel, setExtraSubjectInputLevel] = useState(0);
  const [extraSubjectInputSemester, setExtraSubjectInputSemester] = useState(0);

  const handleAddExtraSubject = () => {
    const newExtraSubject = [`${extraSubjectInputLevel}${career}X${extraSubjectInputSemester}X`, extraSubjectInputName]

    dispatch(addExtraSubject(newExtraSubject));
    setExtraSubjectInputName('');
    setExtraSubjectInputLevel(0);
    setExtraSubjectInputSemester(0);
  }

  const handleRemoveExtraSubject = (extraSubject) => {
    dispatch(removeExtraSubject(extraSubject))
  }

  Modal.setAppElement('#root');
  return (
    <Modal
      isOpen={isOpen}
      style={{
        content: {
          width: '80%',
          height: '90%',
          position: 'none',
          background: 'none',
          border: 'none',
          padding: '0px'
        }, overlay: {
          display: 'flex',
          backgroundColor: 'rgba(17, 17, 17, 0.5)',
          justifyContent: 'center',
          alignItems: 'center'
        }
      }}
    >
      <div className='card'>
        <h5 className='card-header text-center'>Asignaturas opcionales</h5>
        <div className='card-body'>
          <div className='container-fluid'>

            <div className='row mb-3'>
              <div className='form-row'>
                <div className='row'>
                  <div className='col-6'>
                    <label>Nivel de la asginatura:</label>
                    <input type='number' className='form-control' value={extraSubjectInputLevel} onChange={(e) => setExtraSubjectInputLevel(e.target.value)}></input>
                  </div>
                  <div className='col-6'>
                    <label>Semestre de la asginatura:</label>
                    <input type='number' className='form-control' value={extraSubjectInputSemester} onChange={(e) => setExtraSubjectInputSemester(e.target.value)}></input>
                  </div>

                </div>
                <div className='row'>
                  <div className='col-9'>
                    <label>Nombre de la asignatura:</label>
                    <input type='text' className='form-control' value={extraSubjectInputName} onChange={(e) => setExtraSubjectInputName(e.target.value)}></input>
                  </div>
                  <div className='col-3'>
                    <button className='btn btn-primary w-100 mt-4' onClick={handleAddExtraSubject}>Agregar</button>
                  </div>

                </div>
              </div>
            </div>
            <div className='row my-2'>
              <div className='d-flex flex-row-reverse flex-wrap'>
                {extraSubjects.map((subject, index) => (
                  <span className="badge bg-danger mx-1 my-1 excluded-teacher" index={index} onClick={() => handleRemoveExtraSubject(subject)}>{subject[0]} {subject[1]}</span>
                ))}

              </div>
            </div>
            <div className='row d-flex '>
              <button className='btn btn-outline-success mt-4' onClick={() => { setIsOpen(false) }}>Guardar</button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ExtraSubjectsProvider;