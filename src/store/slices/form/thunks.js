// src/store/slices/form/thunks.js
import {
  setGeneratedSchedules,
  setSchedules,
  switchToGeneratedSchedules,
  pickSchedule,
} from "../picker/pickerSlice";
import {
  finishScheduleGeneration,
  startScheduleGeneration,
  setGenerationSummary,
  clearGenerationSummary,
} from "./formSlice";
import axios from "axios";

export const getSchedules = (params = {}) => {
  return async (dispatch, getState) => {
    dispatch(startScheduleGeneration());

    // ✅ limpiar resumen y horario actual ANTES de empezar
    dispatch(clearGenerationSummary());
    dispatch(setGeneratedSchedules([]));
    dispatch(setSchedules([]));
    dispatch(pickSchedule(null));
    dispatch(switchToGeneratedSchedules());

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
    // 4. Normalizar length / credits / available_uses
    // -----------------------------
    let lengthValue =
      params.courseLength ??
      form.courseLength ??
      7;

    let creditsValue =
      params.credits ??
      form.credits ??
      100;

    let availableUsesValue =
      params.availableUses ??
      form.availableUses ??
      1;

    lengthValue = Number(lengthValue);
    creditsValue = Number(creditsValue);
    availableUsesValue = Number(availableUsesValue);

    if (!Number.isFinite(lengthValue) || lengthValue <= 2) {
      lengthValue = 3; // backend exige > 2
    }
    if (!Number.isFinite(creditsValue) || creditsValue <= 0) {
      creditsValue = 1; // backend exige > 0
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
      dispatch(
        setGenerationSummary({
          status: "empty",
          success: false,
          count: 0,
          message:
            "Faltan datos mínimos para generar el horario (carrera o semestres).",
          detail: {
            reasons: [
              "Faltan datos mínimos para generar el horario (carrera o semestres).",
            ],
            suggestions: [
              "Vuelve al inicio, selecciona tu carrera y al menos un semestre / período antes de generar.",
            ],
          },
          reasons: [
            "Faltan datos mínimos para generar el horario (carrera o semestres).",
          ],
          suggestions: [
            "Vuelve al inicio, selecciona tu carrera y al menos un semestre / período antes de generar.",
          ],
        })
      );
      dispatch(finishScheduleGeneration());
      return;
    }

    // -----------------------------
    // 6. Primero: /schedules/download
    // -----------------------------
    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT;
    const downloadUrl = `${apiEndpoint}/schedules/download`;
    const schedulesUrl = `${apiEndpoint}/schedules/`;

    try {
      const userDataRaw = sessionStorage.getItem("saes_user_data");
      let sessionId = null;
      let careerPlan = null;

      if (userDataRaw) {
        try {
          const ud = JSON.parse(userDataRaw);
          sessionId =
            ud.session_id ||
            (ud.carrera_info && ud.carrera_info.session_id) ||
            null;
        } catch {
          /* noop */
        }
      }

      if (!sessionId) {
        throw new Error(
          "No se encontró la sesión de SAES. Vuelve a iniciar sesión."
        );
      }

      const planValue = (() => {
        // el formulario guarda el plan elegido dentro de career.planes
        const fullCareer =
          careerRaw && careerRaw.planes ? careerRaw : form.career;
        const selectedPlan = fullCareer?.selectedPlan || form.selectedPlan;
        if (selectedPlan && selectedPlan.value) return String(selectedPlan.value);
        return fullCareer?.planes && fullCareer.planes[0]?.value
          ? String(fullCareer.planes[0].value)
          : null;
      })();

      careerPlan = planValue;

      const downloadPayload = {
        session_id: sessionId,
        career: career,
        career_plan: careerPlan || undefined,
        plan_period: semesters.map((s) => Number(s)),
      };

      console.log("[getSchedules] POST /schedules/download -> ", downloadPayload);

      const downloadRes = await axios.post(downloadUrl, downloadPayload);
      console.log(
        "[getSchedules] /schedules/download status",
        downloadRes.status,
        "->",
        downloadRes.data
      );

      // -----------------------------
      // 7. Ahora sí: /schedules/ (generar)
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

      console.log("[getSchedules] POST", schedulesUrl, payload);

      const res = await axios.post(schedulesUrl, payload);
      const data = res.data;
      console.log("[getSchedules] /schedules/ status", res.status, "->", data);

      const list = Array.isArray(data) ? data : [];
      const count = list.length;

      dispatch(setGeneratedSchedules(list));
      dispatch(switchToGeneratedSchedules());
      dispatch(setSchedules(list));

      // 🔹 Si hay nuevos horarios, seleccionamos el primero
      if (list.length > 0) {
        dispatch(pickSchedule(list[0]));
      } else {
        dispatch(pickSchedule(null));
      }

      // -----------------------------
      // 8. Construir explicación detallada
      // -----------------------------
      if (count > 0) {
        // ✅ Caso éxito
        dispatch(
          setGenerationSummary({
            status: "success",
            success: true,
            count,
            message: `Se generaron ${count} horarios válidos.`,
            detail: {
              reasons: [],
              suggestions: [
                "Si quieres explorar otras combinaciones, ajusta el número de materias, créditos o el rango de horas y vuelve a generar.",
              ],
            },
            reasons: [],
            suggestions: [
              "Si quieres explorar otras combinaciones, ajusta el número de materias, créditos o el rango de horas y vuelve a generar.",
            ],
          })
        );
      } else {
        // ❌ Caso sin horarios
        const reasons = [];
        const suggestions = [];

        reasons.push(
          "No se encontró ninguna combinación de materias que cumpliera con todos los filtros actuales (semestres, horas, número de materias, créditos y exclusiones)."
        );

        // Número de materias
        if (lengthValue >= 7) {
          reasons.push(
            `Solicitaste un horario con ${lengthValue} materias. Con las materias y grupos disponibles es probable que no existan tantas sin empalmes.`
          );
          suggestions.push(
            "Intenta pedir menos materias (por ejemplo 4, 5 o 6) y vuelve a generar."
          );
        }

        // Créditos altos
        if (creditsValue >= 120) {
          reasons.push(
            `El objetivo de créditos (${creditsValue}) es alto para los semestres seleccionados.`
          );
          suggestions.push(
            "Reduce el total de créditos objetivo o disminuye el número de materias."
          );
        }

        // Semestres limitados
        if (semesters.length === 1) {
          reasons.push(
            `Solo se está usando el semestre/período ${semesters.join(", ")}.`
          );
          suggestions.push(
            "Si tu mapa curricular lo permite, prueba seleccionando más de un semestre o período."
          );
        }

        // Exclusiones
        if (excludedTeachers.length + excludedSubjects.length > 0) {
          reasons.push(
            "Se están excluyendo varios profesores o asignaturas, lo que reduce mucho las combinaciones posibles."
          );
          suggestions.push(
            "Prueba quitando algunas exclusiones de profesores o asignaturas para ampliar las opciones."
          );
        }

        // Materias obligatorias
        if (requiredSubjects.length > 0) {
          reasons.push(
            "Hay materias marcadas como obligatorias; puede que estas se empalmen entre sí o con otras asignaturas."
          );
          suggestions.push(
            "Intenta quitar una o más materias obligatorias y vuelve a generar el horario."
          );
        }

        // Rango horario
        const startH = parseInt(
          (startTimeRaw || "07:00").slice(0, 2),
          10
        );
        const endH = parseInt((endTimeRaw || "21:00").slice(0, 2), 10);
        if (Number.isFinite(startH) && Number.isFinite(endH)) {
          const diff = endH - startH;
          if (diff <= 8) {
            reasons.push(
              "El rango de horas permitido para tomar clases es relativamente corto."
            );
            suggestions.push(
              "Amplía el rango horario (por ejemplo hasta las 20:00 o 22:00) para que entren más combinaciones de materias."
            );
          }
        }

        if (suggestions.length === 0) {
          suggestions.push(
            "Prueba generando con menos materias, ajustando créditos o ampliando el horario disponible."
          );
        }

        dispatch(
          setGenerationSummary({
            status: "empty",
            success: false,
            count: 0,
            message:
              "No se pudieron generar horarios con los parámetros actuales.",
            detail: {
              reasons,
              suggestions,
              conflicts: [],
            },
            reasons,
            suggestions,
          })
        );
      }
    } catch (err) {
      console.error(
        "[getSchedules] Error al generar horarios:",
        err?.response?.data || err.message
      );

      dispatch(setSchedules([]));
      dispatch(pickSchedule(null));

      // Resumen específico para errores de red / backend
      const reasons = [];
      const suggestions = [];
      let status = "error";

      if (err.response?.status === 422) {
        reasons.push(
          "El servidor rechazó algunos parámetros (error de validación 422)."
        );
        suggestions.push(
          "Verifica que el número de materias sea mayor a 2 y los créditos mayores a 0."
        );
      } else if (
        err.response?.status === 401 ||
        (typeof err.response?.data?.detail === "string" &&
          err.response.data.detail
            .toLowerCase()
            .includes("sesion no encontrada o expirada"))
      ) {
        status = "session_expired";
        reasons.push("La sesión con SAES no se encontró o ha expirado.");
        suggestions.push(
          "Vuelve a iniciar sesión con tu boleta y contraseña para continuar generando horarios."
        );
      } else if (err.message?.toLowerCase().includes("network")) {
        reasons.push("No se pudo contactar al servidor de horarios.");
        suggestions.push(
          "Revisa tu conexión a internet y que el backend siga ejecutándose en 127.0.0.1:8000."
        );
      } else if (
        err.message &&
        err.message.includes("No se encontró la sesión de SAES")
      ) {
        status = "session_expired";
        reasons.push("No se encontró la sesión activa de SAES.");
        suggestions.push(
          "Vuelve a iniciar sesión en el módulo de acceso antes de generar horarios."
        );
      } else {
        reasons.push("Ocurrió un error inesperado al generar el horario.");
        suggestions.push(
          "Intenta de nuevo en unos minutos. Si el problema sigue, vuelve a iniciar sesión y repite el proceso."
        );
      }

      dispatch(
        setGenerationSummary({
          status,
          success: false,
          count: 0,
          message: "Ocurrió un problema al generar los horarios.",
          detail: {
            reasons,
            suggestions,
          },
          reasons,
          suggestions,
        })
      );
    } finally {
      dispatch(finishScheduleGeneration());
    }
  };
};
