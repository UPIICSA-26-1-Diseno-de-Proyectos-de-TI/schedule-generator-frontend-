// src/pages/generator/Components/form/components/TeacherExcluder.js
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

/**
 * Modal "Elegir profesores"
 *
 * Usa la lista de horarios generados para construir una tabla de:
 *  - Profesor
 *  - Materia(s) que imparte (con semestre/level entre paréntesis si existe)
 *  - Checkbox "¿Excluir?"
 *
 * Lo que marques aquí se guarda en form.excludedTeachers y se manda al backend
 * en el campo `excluded_teachers` cuando vuelves a presionar "Generar".
 *
 * Props:
 *  - isOpen   : boolean
 *  - setIsOpen: fn(boolean)
 */
const TeacherExcluder = ({ isOpen, setIsOpen }) => {
  const dispatch = useDispatch();

  // Lista global de profesores excluidos (Redux)
  const excludedTeachers =
    useSelector((state) => state.form.excludedTeachers) || [];

  // Horarios generados actuales (fuente para construir la tabla)
  const pickerState = useSelector((state) => state.picker || {});
  const generated = pickerState.generatedSchedules || [];
  const currentSchedules =
    (Array.isArray(generated) && generated.length > 0
      ? generated
      : pickerState.schedules) || [];

  // Selección local dentro del modal (Set para togglear fácilmente)
  const [localSelection, setLocalSelection] = useState(new Set());

  // Cuando se abre el modal, sincronizamos con Redux
  useEffect(() => {
    if (isOpen) {
      setLocalSelection(new Set(excludedTeachers || []));
    }
  }, [isOpen, excludedTeachers]);

  /**
   * Construye las filas de la tabla de profesores a partir
   * de los horarios generados.
   */
  const teacherRows = useMemo(() => {
    const map = new Map();

    const pushCourse = (course) => {
      if (!course) return;

      // Intentamos varios nombres de campo por robustez
      const teacherName =
        course.teacher ||
        course.professor ||
        course.profesor ||
        course.docente ||
        "";

      if (!teacherName) return;

      const subjectName =
        course.subject ||
        course.name ||
        course.asignatura ||
        course.materia ||
        "Asignatura";

      const level =
        course.level ||
        course.semester ||
        course.nivel ||
        course.period ||
        null;

      const subjectLabel = level
        ? `${subjectName} (${level})`
        : subjectName;

      if (!map.has(teacherName)) {
        map.set(teacherName, {
          name: teacherName,
          subjects: new Set(),
        });
      }
      map.get(teacherName).subjects.add(subjectLabel);
    };

    if (Array.isArray(currentSchedules)) {
      currentSchedules.forEach((sch) => {
        const courses =
          sch.courses ||
          sch.subjects ||
          sch.classes ||
          sch.materias ||
          [];
        if (Array.isArray(courses)) {
          courses.forEach(pushCourse);
        }
      });
    }

    // Asegurar que los profesores ya excluidos sigan visibles
    (excludedTeachers || []).forEach((t) => {
      if (!map.has(t)) {
        map.set(t, {
          name: t,
          subjects: new Set(["(no aparece en horarios actuales)"]),
        });
      }
    });

    const rows = Array.from(map.values()).map((row) => ({
      name: row.name,
      subjects: Array.from(row.subjects),
    }));

    // Orden alfabético por nombre de profesor
    rows.sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" })
    );

    return rows;
  }, [currentSchedules, excludedTeachers]);

  const toggleTeacher = (name) => {
    setLocalSelection((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleSave = () => {
    // 1) Limpiamos la lista actual en el slice
    (excludedTeachers || []).forEach((t) =>
      dispatch({ type: "form/removeExcludedTeachers", payload: t })
    );

    // 2) Agregamos la selección nueva
    Array.from(localSelection).forEach((t) =>
      dispatch({ type: "form/addExcludedTeachers", payload: t })
    );

    setIsOpen(false);
  };

  const handleCancel = () => {
    // Volvemos al estado original
    setLocalSelection(new Set(excludedTeachers || []));
    setIsOpen(false);
  };

  const handleClearAll = () => {
    setLocalSelection(new Set());
  };

  if (!isOpen) return null;

  const hasData = teacherRows.length > 0;

  return (
    <div
      className="modal fade show"
      style={{
        display: "block",
        backgroundColor: "rgba(0,0,0,0.45)",
        zIndex: 9999,
      }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content">
          {/* HEADER */}
          <div className="modal-header">
            <h5 className="modal-title">Elegir profesores</h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={handleCancel}
            />
          </div>

          {/* BODY */}
          <div className="modal-body">
            {!hasData && (
              <p className="text-muted mb-0">
                Aún no hay horarios generados. Primero da clic en{" "}
                <strong>"Generar"</strong> y luego vuelve a abrir este panel
                para elegir profesores.
              </p>
            )}

            {hasData && (
              <>
                <p className="mb-2">
                  Selecciona los profesores que quieres{" "}
                  <strong>evitar</strong> en tus horarios futuros. Los cambios
                  se aplican cuando vuelvas a presionar{" "}
                  <strong>"Generar"</strong>.
                </p>

                <div
                  className="table-responsive"
                  style={{ maxHeight: "420px" }}
                >
                  <table className="table table-sm align-middle">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th style={{ width: "90px" }}>¿Excluir?</th>
                        <th>Profesor</th>
                        <th>Materia(s)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherRows.map((row) => (
                        <tr key={row.name}>
                          <td>
                            <div className="form-check d-flex justify-content-center">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={localSelection.has(row.name)}
                                onChange={() => toggleTeacher(row.name)}
                              />
                            </div>
                          </td>
                          <td>{row.name}</td>
                          <td>
                            {row.subjects && row.subjects.length > 0
                              ? row.subjects.join(", ")
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* FOOTER */}
          <div className="modal-footer d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleClearAll}
              disabled={!hasData || localSelection.size === 0}
            >
              Limpiar todo
            </button>

            <div>
              <button
                type="button"
                className="btn btn-secondary me-2"
                onClick={handleCancel}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleSave}
                disabled={!hasData}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherExcluder;
