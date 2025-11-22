import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addExcludedSubjects,
  removeExcludedSubjects,
} from "../../../../../store/slices/form/formSlice";

import CenteredExcludeModal from "../CenteredExcludeModal";
import "../exclude-modal.css";

const SubjectExcluder = ({ isOpen, setIsOpen }) => {
  const dispatch = useDispatch();
  const excludedSubjects = useSelector(
    (state) => state.form.excludedSubjects
  );

  const [excludedSubjectInput, setExcludedSubjectInput] = useState("");

  const handleAddExcludedSubject = () => {
    const value = excludedSubjectInput.trim();
    if (!value) return;
    dispatch(addExcludedSubjects(value));
    setExcludedSubjectInput("");
  };

  const handleRemoveExcludedSubject = (subject) => {
    dispatch(removeExcludedSubjects(subject));
  };

  const handleSave = () => {
    // La lista ya está en Redux, solo cerramos el modal
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddExcludedSubject();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <CenteredExcludeModal
      open={isOpen}
      title="Excluir asignaturas"
      onClose={handleClose}
    >
      <div className="exclude-modal-body">
        <label style={{ display: "block", marginBottom: "8px" }}>
          Ingresa el nombre de la asignatura a excluir:
        </label>

        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <input
            type="text"
            className="form-control"
            value={excludedSubjectInput}
            onChange={(e) => setExcludedSubjectInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej. Cálculo Integral"
          />
          <button
            type="button"
            className="btn btn-primary w-100"
            style={{ maxWidth: "120px" }}
            onClick={handleAddExcludedSubject}
          >
            Excluir
          </button>
        </div>

        {excludedSubjects.length > 0 && (
          <div className="row my-2">
            <div className="d-flex flex-row-reverse flex-wrap">
              {excludedSubjects.map((subject, index) => (
                <span
                  key={`${subject}-${index}`}
                  className="badge bg-danger mx-1 my-1 excluded-teacher"
                  onClick={() => handleRemoveExcludedSubject(subject)}
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="exclude-modal-footer">
        <button
          type="button"
          className="btn btn-outline-success mt-2"
          onClick={handleSave}
        >
          Guardar
        </button>
      </div>
    </CenteredExcludeModal>
  );
};

export default SubjectExcluder;
