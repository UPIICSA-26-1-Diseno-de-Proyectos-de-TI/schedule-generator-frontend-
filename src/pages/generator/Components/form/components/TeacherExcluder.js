import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addExcludedTeachers,
  removeExcludedTeachers,
} from "../../../../../store/slices/form/formSlice";

import CenteredExcludeModal from "../CenteredExcludeModal";
import "../exclude-modal.css";

const TeacherExcluder = ({ isOpen, setIsOpen }) => {
  const dispatch = useDispatch();
  const excludedTeachers = useSelector(
    (state) => state.form.excludedTeachers
  );

  const [excludedTeacherInput, setExcludedTeacherInput] = useState("");

  const handleAddExcludedTeacher = () => {
    const value = excludedTeacherInput.trim();
    if (!value) return;
    dispatch(addExcludedTeachers(value));
    setExcludedTeacherInput("");
  };

  const handleRemoveExcludedTeacher = (teacher) => {
    dispatch(removeExcludedTeachers(teacher));
  };

  const handleSave = () => {
    // La lista ya está en Redux, solo cerramos el modal
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddExcludedTeacher();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <CenteredExcludeModal
      open={isOpen}
      title="Excluir profesores"
      onClose={handleClose}
    >
      <div className="exclude-modal-body">
        <label style={{ display: "block", marginBottom: "8px" }}>
          Ingresa el nombre del profesor a excluir:
        </label>

        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <input
            type="text"
            className="form-control"
            value={excludedTeacherInput}
            onChange={(e) => setExcludedTeacherInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej. Juan Pérez"
          />
          <button
            type="button"
            className="btn btn-primary w-100"
            style={{ maxWidth: "120px" }}
            onClick={handleAddExcludedTeacher}
          >
            Excluir
          </button>
        </div>

        {excludedTeachers.length > 0 && (
          <div className="row my-2">
            <div className="d-flex flex-row-reverse flex-wrap">
              {excludedTeachers.map((teacher, index) => (
                <span
                  key={`${teacher}-${index}`}
                  className="badge bg-danger mx-1 my-1 excluded-teacher"
                  onClick={() => handleRemoveExcludedTeacher(teacher)}
                >
                  {teacher}
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

export default TeacherExcluder;
