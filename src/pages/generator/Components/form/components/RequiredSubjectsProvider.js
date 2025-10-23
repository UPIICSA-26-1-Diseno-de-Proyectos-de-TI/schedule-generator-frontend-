import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addRequiredSubject, removeRequiredSubject } from "../../../../../store/slices/form/formSlice";
import Modal from 'react-modal';

const RequiredSubjectsProvider = ({ isOpen, setIsOpen }) => {
  const dispatch = useDispatch();
  const requiredSubjects = useSelector(state => state.form.requiredSubjects);
  const career = useSelector(state => state.form.career);

  const [requiredSubjectInputName, setRequiredSubjectInputName] = useState('');
  const [requiredSubjectInputLevel, setRequiredSubjectInputLevel] = useState(0);
  const [requiredSubjectInputSemester, setRequiredSubjectInputSemester] = useState(0);

  const handleAddRequiredSubject = () => {
    const newRequiredSubject = [`${requiredSubjectInputLevel}${career}X${requiredSubjectInputSemester}X`, requiredSubjectInputName]

    dispatch(addRequiredSubject(newRequiredSubject));
    setRequiredSubjectInputName('');
    setRequiredSubjectInputLevel(0);
    setRequiredSubjectInputSemester(0);
  }

  const handleRemoveRequiredSubject = (requiredSubject) => {
    dispatch(removeRequiredSubject(requiredSubject))
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
        <h5 className='card-header text-center'>Asignaturas requeridas</h5>
        <div className='card-body'>
          <div className='container-fluid'>

            <div className='row mb-3'>
              <div className='form-row'>
                <div className='row'>
                  <div className='col-6'>
                    <label>Nivel de la asginatura:</label>
                    <input type='number' className='form-control' value={requiredSubjectInputLevel} onChange={(e) => setRequiredSubjectInputLevel(e.target.value)}></input>
                  </div>
                  <div className='col-6'>
                    <label>Semestre de la asginatura:</label>
                    <input type='number' className='form-control' value={requiredSubjectInputSemester} onChange={(e) => setRequiredSubjectInputSemester(e.target.value)}></input>
                  </div>

                </div>
                <div className='row'>
                  <div className='col-9'>
                    <label>Nombre de la asignatura:</label>
                    <input type='text' className='form-control' value={requiredSubjectInputName} onChange={(e) => setRequiredSubjectInputName(e.target.value)}></input>
                  </div>
                  <div className='col-3'>
                    <button className='btn btn-primary w-100 mt-4' onClick={handleAddRequiredSubject}>Agregar</button>
                  </div>

                </div>
              </div>
            </div>
            <div className='row my-2'>
              <div className='d-flex flex-row-reverse flex-wrap'>
                {requiredSubjects.map((subject, index) => (
                  <span className="badge bg-danger mx-1 my-1 excluded-teacher" index={index} onClick={() => handleRemoveRequiredSubject(subject)}>{subject[0]} {subject[1]}</span>
                ))}

              </div>
            </div>
            <div className='row d-flex '>
              <button className='btn btn-outline-success mt-4' onClick={() => setIsOpen(false)}>Guardar</button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default RequiredSubjectsProvider;