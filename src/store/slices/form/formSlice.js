// src/store/slices/form/formSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Parámetros de filtros
  levels: [],                // se mantiene en sync con semesters
  semesters: [],             // periodos seleccionados (1..8)
  startTime: "07:00",
  endTime: "15:00",
  career: null,              // objeto carrera { value, text, planes }
  shifts: ["M", "V"],        // turnos disponibles (por ahora fijo)

  // Parámetros del generador
  courseLength: 7,           // número de materias por horario
  credits: 100,              // créditos totales objetivo
  availableUses: 1,          // usos disponibles del generador

  // Restricciones
  excludedTeachers: [],
  excludedSubjects: [],
  extraSubjects: [],
  requiredSubjects: [],

  // Estado de carga
  isGenerating: false,
};

const formSlice = createSlice({
  name: "form",
  initialState,
  reducers: {
    changeStartTime(state, action) {
      state.startTime = action.payload;
    },
    changeEndTime(state, action) {
      state.endTime = action.payload;
    },

    addSemester(state, action) {
      const value = String(action.payload);
      if (!state.semesters.map(String).includes(value)) {
        state.semesters.push(value);
      }
      // el backend usa "levels" y "semesters", los mantenemos iguales
      state.levels = [...state.semesters];
    },
    removeSemester(state, action) {
      const value = String(action.payload);
      state.semesters = state.semesters.filter((s) => String(s) !== value);
      state.levels = [...state.semesters];
    },

    setCareer(state, action) {
      state.career = action.payload; // objeto carrera completo
      // al cambiar de carrera reiniciamos periodos
      state.semesters = [];
      state.levels = [];
    },

    changeCourseLength(state, action) {
      state.courseLength = Number(action.payload) || 0;
    },
    changeCredits(state, action) {
      state.credits = Number(action.payload) || 0;
    },
    changeAvailableUses(state, action) {
      state.availableUses = Number(action.payload) || 1;
    },

    // Exclusión de profesores
    addExcludedTeachers(state, action) {
      const name = (action.payload || "").trim();
      if (!name) return;
      if (!state.excludedTeachers.includes(name)) {
        state.excludedTeachers.push(name);
      }
    },
    removeExcludedTeachers(state, action) {
      const name = action.payload;
      state.excludedTeachers = state.excludedTeachers.filter(
        (t) => t !== name
      );
    },

    // Exclusión de materias
    addExcludedSubjects(state, action) {
      const name = (action.payload || "").trim();
      if (!name) return;
      if (!state.excludedSubjects.includes(name)) {
        state.excludedSubjects.push(name);
      }
    },
    removeExcludedSubjects(state, action) {
      const name = action.payload;
      state.excludedSubjects = state.excludedSubjects.filter(
        (s) => s !== name
      );
    },

    // Materias extra
    addExtraSubject(state, action) {
      const name = (action.payload || "").trim();
      if (!name) return;
      if (!state.extraSubjects.includes(name)) {
        state.extraSubjects.push(name);
      }
    },
    removeExtraSubject(state, action) {
      const name = action.payload;
      state.extraSubjects = state.extraSubjects.filter((s) => s !== name);
    },

    // Materias obligatorias
    addRequiredSubject(state, action) {
      const name = (action.payload || "").trim();
      if (!name) return;
      if (!state.requiredSubjects.includes(name)) {
        state.requiredSubjects.push(name);
      }
    },
    removeRequiredSubject(state, action) {
      const name = action.payload;
      state.requiredSubjects = state.requiredSubjects.filter(
        (s) => s !== name
      );
    },

    // Estado de generación
    startScheduleGeneration(state) {
      state.isGenerating = true;
    },
    finishScheduleGeneration(state) {
      state.isGenerating = false;
    },
  },
});

export const {
  changeStartTime,
  changeEndTime,
  addSemester,
  removeSemester,
  setCareer,
  changeCourseLength,
  changeCredits,
  changeAvailableUses,
  addExcludedTeachers,
  removeExcludedTeachers,
  addExcludedSubjects,
  removeExcludedSubjects,
  addExtraSubject,
  removeExtraSubject,
  addRequiredSubject,
  removeRequiredSubject,
  startScheduleGeneration,
  finishScheduleGeneration,
} = formSlice.actions;

export default formSlice.reducer;
