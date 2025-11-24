// src/pages/generator/Components/form/components/SubjectExcluder.js
import React, { useEffect, useMemo, useState } from "react";
import Modal from "react-modal";
import { useDispatch, useSelector } from "react-redux";
import {
  addExcludedSubjects,
  removeExcludedSubjects,
} from "../../../../../store/slices/form/formSlice";

Modal.setAppElement("#root");

// Clave donde guardamos la relación MATERIA -> semestre
const SUBJECT_META_KEY = "saes_excluded_subjects_meta";

function loadSubjectMeta() {
  try {
    const raw = sessionStorage.getItem(SUBJECT_META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveSubjectMeta(meta) {
  try {
    sessionStorage.setItem(SUBJECT_META_KEY, JSON.stringify(meta));
  } catch {
    // noop
  }
}

export default function SubjectExcluder({ isOpen, setIsOpen }) {
  const dispatch = useDispatch();

  const excludedSubjects = useSelector(
    (state) => state.form.excludedSubjects || []
  );
  const generatedSchedules = useSelector(
    (state) => state.picker.generatedSchedules || []
  );

  // Set local de materias seleccionadas (clave = nombre en MAYÚSCULAS)
  const [localSelected, setLocalSelected] = useState(new Set());

  // Meta: SUBJECT_UPPER -> { subjectName, semester }
  const [subjectMeta, setSubjectMeta] = useState(() => loadSubjectMeta());

  // Sincronizar checks cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      const s = new Set(
        (excludedSubjects || []).map((name) => String(name).toUpperCase())
      );
      setLocalSelected(s);
    }
  }, [isOpen, excludedSubjects]);

  // -----------------------------------
  // 1) Extraer cursos de horarios
  // -----------------------------------
  const allCourses = useMemo(() => {
    const list = [];
    (generatedSchedules || []).forEach((sch) => {
      const courses =
        sch.courses ||
        sch.materias ||
        sch.subjects ||
        sch.cursos ||
        sch.horario ||
        [];
      if (Array.isArray(courses)) {
        courses.forEach((c) => c && list.push(c));
      }
    });
    return list;
  }, [generatedSchedules]);

  // -----------------------------------
  // 2) Actualizar meta (materia -> semestre)
  //    cada vez que cambian los cursos
  // -----------------------------------
  useEffect(() => {
    if (!allCourses.length) return;

    setSubjectMeta((prev) => {
      const meta = { ...prev };

      allCourses.forEach((course) => {
        const rawSubject =
          course.subject ||
          course.materia ||
          course.nombre ||
          course.name ||
          "";
        if (!rawSubject) return;

        const subjectName = String(rawSubject).trim().toUpperCase();
        const level =
          course.level ||
          course.semester ||
          course.period ||
          course.nivel ||
          course.semestre ||
          null;
        const semester =
          level != null && level !== "" ? String(level) : meta[subjectName]?.semester || "—";

        // Guardamos el semestre "más bajo" conocido
        if (!meta[subjectName]) {
          meta[subjectName] = { subjectName, semester };
        } else {
          const prevSem = meta[subjectName].semester;
          const nPrev = Number(prevSem);
          const nNew = Number(semester);
          if (!Number.isNaN(nNew)) {
            if (Number.isNaN(nPrev) || nNew < nPrev) {
              meta[subjectName] = { subjectName, semester };
            }
          }
        }
      });

      saveSubjectMeta(meta);
      return meta;
    });
  }, [allCourses]);

  // -----------------------------------
  // 3) Construir tablas por semestre
  // -----------------------------------
  const { rowsBySemester, sortedSemesters, subjectLabelMap } = useMemo(() => {
    const bySemester = {};
    const existingSubjectUpper = new Set();
    const labelMap = {};

    // a) materias a partir de los cursos actuales
    allCourses.forEach((course) => {
      const rawSubject =
        course.subject ||
        course.materia ||
        course.nombre ||
        course.name ||
        "";
      if (!rawSubject) return;

      const subjectName = String(rawSubject).trim().toUpperCase();

      const level =
        course.level ||
        course.semester ||
        course.period ||
        course.nivel ||
        course.semestre ||
        null;
      const semester = level != null ? String(level) : "—";

      const teacherRaw =
        course.teacher ||
        course.professor ||
        course.profesor ||
        course.docente ||
        "";
      const teacherName = String(teacherRaw).trim().toUpperCase();

      const seq =
        course.sequence ||
        course.secuencia ||
        course.group ||
        course.grupo ||
        "";

      const subjectKey = subjectName.toUpperCase();
      const semKey = semester;

      // grupo por semestre + materia
      if (!bySemester[semKey]) bySemester[semKey] = [];

      // buscamos si ya existe esa materia en ese semestre
      let row = bySemester[semKey].find(
        (r) => r.subjectKey === subjectKey && r.semester === semKey
      );
      if (!row) {
        row = {
          semester: semKey,
          subjectName,
          subjectKey,
          teachers: new Map(), // name -> Set<seq>
          missing: false,
        };
        bySemester[semKey].push(row);
      }

      if (teacherName) {
        if (!row.teachers.has(teacherName)) {
          row.teachers.set(teacherName, new Set());
        }
        if (seq) {
          row.teachers.get(teacherName).add(String(seq));
        }
      }

      existingSubjectUpper.add(subjectKey);
      if (!labelMap[subjectKey]) {
        labelMap[subjectKey] = subjectName;
      }
    });

    // b) convertir teachers a string
    Object.keys(bySemester).forEach((sem) => {
      bySemester[sem].forEach((row) => {
        const teacherParts = [];
        row.teachers.forEach((seqSet, tName) => {
          const seqs = Array.from(seqSet);
          let label = tName;
          if (seqs.length > 0) {
            // VIERA LOPEZ HARO (4CM42)-(4CM40)
            label += ` (${seqs.join(")-(")})`;
          }
          teacherParts.push(label);
        });
        row.teachersLabel = teacherParts.join(", ") || "—";
      });
    });

    // c) Agregar filas para materias excluidas que YA NO salen
    const excludedUpper = (excludedSubjects || []).map((n) =>
      String(n).toUpperCase()
    );

    excludedUpper.forEach((upName, idx) => {
      if (!existingSubjectUpper.has(upName)) {
        // usar meta para saber semestre original
        const metaInfo = subjectMeta[upName];
        const semKey = metaInfo?.semester || "—";

        const displayName =
          metaInfo?.subjectName ||
          labelMap[upName] ||
          String(excludedSubjects[idx] || upName).toUpperCase();

        if (!bySemester[semKey]) bySemester[semKey] = [];

        bySemester[semKey].push({
          semester: semKey,
          subjectName: displayName,
          subjectKey: upName,
          teachersLabel:
            "Esta asignatura no aparece en los horarios generados actuales.",
          missing: true,
        });

        if (!labelMap[upName]) {
          labelMap[upName] = displayName;
        }
      }
    });

    // d) Ordenar materias dentro de cada semestre
    Object.keys(bySemester).forEach((sem) => {
      bySemester[sem].sort((a, b) =>
        a.subjectName.localeCompare(b.subjectName, "es")
      );
    });

    // e) Ordenar semestres (numéricos primero)
    const semKeys = Object.keys(bySemester).sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      const aNum = !Number.isNaN(na);
      const bNum = !Number.isNaN(nb);
      if (aNum && bNum) return na - nb;
      if (aNum) return -1;
      if (bNum) return 1;
      return String(a).localeCompare(String(b), "es");
    });

    return {
      rowsBySemester: bySemester,
      sortedSemesters: semKeys,
      subjectLabelMap: labelMap,
    };
  }, [allCourses, excludedSubjects, subjectMeta]);

  // -----------------------------------
  // Handlers
  // -----------------------------------
  const toggleSubject = (subjectKey) => {
    setLocalSelected((prev) => {
      const next = new Set(prev);
      const key = String(subjectKey).toUpperCase();
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleClearAll = () => {
    setLocalSelected(new Set());
  };

  const handleCancel = () => {
    const s = new Set(
      (excludedSubjects || []).map((name) => String(name).toUpperCase())
    );
    setLocalSelected(s);
    setIsOpen(false);
  };

  const handleSave = () => {
    const nextUpper = Array.from(localSelected);

    // mapa actual upper -> nombre original
    const currentMap = new Map();
    (excludedSubjects || []).forEach((n) =>
      currentMap.set(String(n).toUpperCase(), n)
    );

    // 1) agregar nuevos (no estaban antes)
    nextUpper.forEach((upName) => {
      if (!currentMap.has(upName)) {
        const label = subjectLabelMap[upName] || upName;
        dispatch(addExcludedSubjects(label));
      }
    });

    // 2) quitar los que ya no están marcados
    currentMap.forEach((originalName, upName) => {
      if (!nextUpper.includes(upName)) {
        dispatch(removeExcludedSubjects(originalName));
      }
    });

    // meta ya se actualiza con los cursos en el useEffect de arriba
    setIsOpen(false);
  };

  // -----------------------------------
  // Estilos del modal
  // -----------------------------------
  const modalStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      transform: "translate(-50%, -50%)",
      width: "94vw",
      maxWidth: "1200px",
      maxHeight: "82vh",
      padding: 0,
      borderRadius: 12,
      border: "none",
      overflowY: "auto", // scroll vertical para ver todas las tablas
      boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
      background: "#ffffff",
    },
    overlay: {
      backgroundColor: "rgba(0,0,0,0.45)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={handleCancel} style={modalStyles}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px 10px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h5 style={{ margin: 0, fontWeight: 600 }}>Elegir asignaturas</h5>
          <button
            type="button"
            onClick={handleCancel}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 18,
              lineHeight: 1,
              cursor: "pointer",
            }}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Controles superiores */}
        <div
          style={{
            padding: "12px 20px 8px",
            borderBottom: "1px solid #f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 14 }}>
            Selecciona las asignaturas que quieres excluir de tus horarios.
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: "6px 16px",
                fontSize: 14,
                borderRadius: 999,
                border: "1px solid #16a34a",
                background: "#16a34a",
                color: "#fff",
                fontWeight: 500,
              }}
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: "6px 16px",
                fontSize: 14,
                borderRadius: 999,
                border: "1px solid #9ca3af",
                background: "#f3f4f6",
                color: "#374151",
                fontWeight: 500,
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                padding: "6px 16px",
                fontSize: 14,
                borderRadius: 999,
                border: "1px solid #6b7280",
                background: "#4b5563",
                color: "#fff",
                fontWeight: 500,
              }}
            >
              Limpiar todo
            </button>
          </div>
        </div>

        {/* Tablas por semestre */}
        <div style={{ padding: "16px 20px 20px" }}>
          {sortedSemesters.length === 0 ? (
            <p className="text-muted mb-0">
              Aún no hay horarios generados para construir la lista de
              asignaturas. Primero genera horarios y luego vuelve a abrir este
              panel.
            </p>
          ) : (
            sortedSemesters.map((sem) => {
              const rows = rowsBySemester[sem] || [];
              if (!rows.length) return null;

              return (
                <div key={sem} style={{ marginBottom: 22 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: 6,
                      fontSize: 14,
                    }}
                  >
                    Semestre: {sem}
                  </div>

                  <div
                    style={{
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      overflow: "hidden",
                      fontSize: 13,
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        tableLayout: "fixed",
                      }}
                    >
                      <thead
                        style={{
                          background: "#f9fafb",
                          borderBottom: "1px solid #d1d5db",
                        }}
                      >
                        <tr>
                          <th
                            style={{
                              width: "90px",
                              padding: "8px 10px",
                              textAlign: "left",
                              borderRight: "1px solid #e5e7eb",
                            }}
                          >
                            ¿Excluir
                            <br />
                            materia?
                          </th>
                          <th
                            style={{
                              padding: "8px 10px",
                              textAlign: "left",
                              borderRight: "1px solid #e5e7eb",
                            }}
                          >
                            Materia
                          </th>
                          <th
                            style={{
                              padding: "8px 10px",
                              textAlign: "left",
                            }}
                          >
                            Profesor (es)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, idxRow) => {
                          const checked = localSelected.has(row.subjectKey);
                          const isGhost = row.missing;

                          return (
                            <tr
                              key={`${row.subjectKey}-${idxRow}`}
                              style={{
                                borderTop: "1px solid #e5e7eb",
                                backgroundColor: isGhost
                                  ? "#fef2f2"
                                  : "transparent",
                              }}
                            >
                              <td
                                style={{
                                  padding: "6px 10px",
                                  verticalAlign: "middle",
                                  borderRight: "1px solid #e5e7eb",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    toggleSubject(row.subjectKey)
                                  }
                                />
                              </td>
                              <td
                                style={{
                                  padding: "6px 10px",
                                  verticalAlign: "middle",
                                  borderRight: "1px solid #e5e7eb",
                                  fontWeight: 500,
                                }}
                              >
                                {row.subjectName}
                              </td>
                              <td
                                style={{
                                  padding: "6px 10px",
                                  verticalAlign: "middle",
                                  color: isGhost ? "#b91c1c" : "#111827",
                                  fontStyle: isGhost ? "italic" : "normal",
                                }}
                              >
                                {row.teachersLabel}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
