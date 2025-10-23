import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addExcludedSubjects, removeExcludedSubjects } from "../../../../../store/slices/form/formSlice";
import Modal from 'react-modal';

const SubjectExcluder = ({ isOpen, setIsOpen }) => {
  const dispatch = useDispatch();
  const excludedSubjects = useSelector(state => state.form.excludedSubjects);

  const [excludedSubjectInput, setExcludedSubjectInput] = useState('');

  const handleAddExcludedSubject = () => {
    dispatch(addExcludedSubjects(excludedSubjectInput))
    setExcludedSubjectInput('');
  }

  const handleRemoveExcludedSubeject = (subject) => {
    dispatch(removeExcludedSubjects(subject))
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
        <h5 className='card-header text-center'>Excluir asginaturas</h5>
        <div className='card-body'>
          <div className='container-fluid'>

            <div className='row mb-3'>
              <div className='form-row'>
                <div className='row'>
                  <div className='col-9'>
                    <label>Ingresa el nombre de la asignatura a excluir:</label>
                    <input type='text' className='form-control' value={excludedSubjectInput} onChange={(e) => setExcludedSubjectInput(e.target.value)}></input>
                  </div>
                  <div className='col-3'>
                    <button className='btn btn-primary w-100 mt-4' onClick={handleAddExcludedSubject}>Excluir</button>
                  </div>

                </div>
              </div>
            </div>
            <div className='row my-2'>
              <div className='d-flex flex-row-reverse flex-wrap'>
                {excludedSubjects.map((subject, index) => (
                  <span className="badge bg-danger mx-1 my-1 excluded-teacher" index={index} onClick={() => handleRemoveExcludedSubeject(subject)}>{subject}</span>
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

export default SubjectExcluder;