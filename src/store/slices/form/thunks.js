import {
  setGeneratedSchedules,
  setSchedules,
  switchToGeneratedSchedules,
} from "../picker/pickerSlice";
import {
  finishScheduleGeneration,
  startScheduleGeneration,
} from "./formSlice";
import axios from "axios";

export const getSchedules = (params = {}) => {
  return async (dispatch, getState) => {
    dispatch(startScheduleGeneration());

    const state = getState();
    const form = state.form;

    // -----------------------------
    // 1. Tomar valores base del form
    // -----------------------------
    const careerRaw = params.career ?? form.career;
    const semestersRaw = params.semesters ?? form.semesters;
    const startTimeRaw = params.startTime ?? form.startTime;
    const endTimeRaw = params.endTime ?? form.endTime;

    const excludedTeachers =
      params.excludedTeachers ?? form.excludedTeachers ?? [];
    const excludedSubjects =
      params.excludedSubjects ?? form.excludedSubjects ?? [];
    const requiredSubjects =
      params.requiredSubjects ?? form.requiredSubjects ?? [];
    const extraSubjects =
      params.extraSubjects ?? form.extraSubjects ?? [];

    // -----------------------------
    // 2. Normalizar semestres / niveles
    // -----------------------------
    const semesters = Array.isArray(semestersRaw)
      ? semestersRaw.map((s) => String(s).trim()).filter(Boolean)
      : [];

    const levels = semesters;

    // -----------------------------
    // 3. Normalizar carrera
    // -----------------------------
    const career = (() => {
      if (!careerRaw) return "";
      if (typeof careerRaw === "string") return careerRaw.trim();
      if (careerRaw.value) return String(careerRaw.value).trim();
      if (careerRaw.codigo) return String(careerRaw.codigo).trim();
      if (careerRaw.code) return String(careerRaw.code).trim();
      return "";
    })();

    // -----------------------------
    // 4. Normalizar length / credits
    //    (respetar restricciones del backend)
    // -----------------------------
    let lengthValue =
      params.courseLength ??
      form.courseLength ??
      7; // valor por defecto razonable

    let creditsValue =
      params.credits ??
      form.credits ??
      100; // valor por defecto razonable

    let availableUsesValue =
      params.availableUses ??
      form.availableUses ??
      1;

    lengthValue = Number(lengthValue);
    creditsValue = Number(creditsValue);
    availableUsesValue = Number(availableUsesValue);

    // Si vienen inválidos o muy bajos, los corregimos
    if (!Number.isFinite(lengthValue) || lengthValue <= 2) {
      lengthValue = 3; // el backend exige > 2
    }
    if (!Number.isFinite(creditsValue) || creditsValue <= 0) {
      creditsValue = 1; // el backend exige > 0
    }
    if (!Number.isFinite(availableUsesValue) || availableUsesValue <= 0) {
      availableUsesValue = 1;
    }

    // -----------------------------
    // 5. Validación rápida frontend
    // -----------------------------
    if (!career || semesters.length === 0) {
      console.warn(
        "[getSchedules] Faltan datos mínimos (carrera o semestres).",
        { career, semesters }
      );
      dispatch(finishScheduleGeneration());
      return;
    }

    // -----------------------------
    // 6. Payload EXACTO que espera el backend
    // -----------------------------
    const payload = {
      career,
      levels,
      semesters,
      start_time: (startTimeRaw || "07:00").slice(0, 5),
      end_time: (endTimeRaw || "21:00").slice(0, 5),
      length: lengthValue,
      credits: creditsValue,
      available_uses: availableUsesValue,
      excluded_teachers: excludedTeachers,
      excluded_subjects: excludedSubjects,
      required_subjects: requiredSubjects,
      extra_subjects: extraSubjects,
      shifts: ["M", "V"],
    };

    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT;
    const url = `${apiEndpoint}/schedules/`;

    console.log("[getSchedules] POST", url, payload);

    try {
      const res = await axios.post(url, payload);
      const data = res.data;
      console.log("[getSchedules] status", res.status, "->", data);

      // data es un array de horarios (puede venir vacío)
      dispatch(setGeneratedSchedules(data));
      dispatch(switchToGeneratedSchedules());
      dispatch(setSchedules(data));
    } catch (err) {
      console.error(
        "[getSchedules] Error al generar horarios:",
        err?.response?.data || err.message
      );
      dispatch(setSchedules([]));
    } finally {
      dispatch(finishScheduleGeneration());
    }
  };
};
