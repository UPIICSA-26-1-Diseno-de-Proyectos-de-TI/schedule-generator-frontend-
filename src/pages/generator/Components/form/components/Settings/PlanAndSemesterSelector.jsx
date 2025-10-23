import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';


const STORAGE_KEYS = {
  USER_DATA: 'saes_user_data',
  CARRERAS: 'saes_carreras',
  SELECTED_PLAN: 'saes_selected_plan',
  SELECTED_PERIODS: 'saes_selected_periods'
};

function readCareerFromSession() {
  try {
    const s = sessionStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (s) {
      const obj = JSON.parse(s);
      const carreras = (obj.carrera_info && obj.carrera_info.carreras) || obj.carreras || null;
      const storedPlan = sessionStorage.getItem(STORAGE_KEYS.SELECTED_PLAN);
      return { carreras, storedPlan };
    }
    const raw = sessionStorage.getItem(STORAGE_KEYS.CARRERAS);
    if (raw) return { carreras: JSON.parse(raw) };
  } catch (e) {
    console.warn('PlanAndSemesterSelector: error leyendo sessionStorage', e);
  }
  return { carreras: null };
}

export default function PlanAndSemesterSelector({ onChange }) {
  const careerFromStore = useSelector(state => (state.form && state.form.career) ? state.form.career : null);
  const [career, setCareer] = useState(careerFromStore || null);
  const [plans, setPlans] = useState([]);
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(null); 
  const [selectedPeriods, setSelectedPeriods] = useState([]); 

  useEffect(() => {
    if (careerFromStore) {
      setCareer(careerFromStore);
      const p = careerFromStore.planes || careerFromStore.plans || [];
      setPlans(p);
      // cargar selección previa si existe (sessionStorage)
      const sp = sessionStorage.getItem(STORAGE_KEYS.SELECTED_PLAN);
      if (sp) {
        try {
          const parsed = JSON.parse(sp);
          if (parsed && parsed.careerValue === (careerFromStore.value || careerFromStore.clave)) {
            setSelectedPlanIdx(parsed.planIndex ?? null);
          }
        } catch (e) {/* noop */}
      }
      const speriods = sessionStorage.getItem(STORAGE_KEYS.SELECTED_PERIODS);
      if (speriods) {
        try { setSelectedPeriods(JSON.parse(speriods)); } catch(e){ }
      }
      return;
    }

    const { carreras } = readCareerFromSession();
    if (carreras && carreras.length) {
    }
  }, [careerFromStore]);

  useEffect(() => {
    if (selectedPlanIdx === null || selectedPlanIdx === undefined) {
      sessionStorage.removeItem(STORAGE_KEYS.SELECTED_PLAN);
      sessionStorage.removeItem(STORAGE_KEYS.SELECTED_PERIODS);
      if (onChange) onChange(null);
      return;
    }

    const plan = plans[selectedPlanIdx];
    // Guardar plan seleccionado con referencia a la carrera actual
    const careerValue = career?.value ?? career?.clave ?? null;
    sessionStorage.setItem(STORAGE_KEYS.SELECTED_PLAN, JSON.stringify({
      careerValue,
      planIndex: selectedPlanIdx,
      planValue: plan?.value ?? plan?.clave ?? null,
      planText: plan?.text ?? plan?.nombre ?? ''
    }));

    // resetear periodos seleccionados al cambiar de plan
    setSelectedPeriods([]);
    sessionStorage.setItem(STORAGE_KEYS.SELECTED_PERIODS, JSON.stringify([]));

    // notificar al integrador
    if (onChange) onChange({ career: careerValue, planIndex: selectedPlanIdx, plan });
  }, [selectedPlanIdx]);

  // cuando cambian selectedPeriods los guardamos y notificamos
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.SELECTED_PERIODS, JSON.stringify(selectedPeriods || []));
    if (onChange) onChange({ career: career?.value ?? career?.clave, planIndex: selectedPlanIdx, selectedPeriods });
  }, [selectedPeriods]);

  // handler select plan
  function handlePlanChange(e) {
    const idx = e.target.value === '' ? null : Number(e.target.value);
    if (idx === null) {
      setSelectedPlanIdx(null);
    } else {
      setSelectedPlanIdx(idx);
    }
  }

  // toggle periodo checkbox
  function togglePeriod(periodIndexOrValue) {
    const value = periodIndexOrValue;
    setSelectedPeriods(prev => {
      const exists = prev.find(p => p === value);
      if (exists !== undefined) {
        return prev.filter(p => p !== value);
      } else {
        return [...(prev || []), value];
      }
    });
  }

  // Si no tenemos career, intentar leer carreras del sessionStorage para poblar select si necesario
  useEffect(() => {
    if (!career) {
      const { carreras } = readCareerFromSession();
      if (carreras && carreras.length > 0) {
      }
    } else {
      // actualizar planes si career cambia
      const p = career.planes || career.plans || [];
      setPlans(p);
    }
  }, [career]);

  // Helper: obtener array de labels de periodos desde el plan
  function getPeriodLabelsForPlan(plan) {
    if (!plan) return [];
    // si plan.periodos existe y es array, intentar mapear nombres o usar índices
    if (Array.isArray(plan.periodos) && plan.periodos.length > 0) {
      // Si el elemento de periodos tiene texto nominativo se usa, si no se usa "Sem. X"
      return plan.periodos.map((p, i) => {
        if (typeof p === 'string' || typeof p === 'number') return String(p);
        // p puede ser un objeto con propiedades (name/text)
        return (p.text || p.nombre || p.name || (`Semestre ${i+1}`)).toString();
      });
    }
    // fallback: si no hay periodos en datos, generar por el atributo plan.periods_count o plan.num_periodos
    const n = plan.periodos_count || plan.num_periodos || plan.periods || (plan.periodos && plan.periodos.length) || 0;
    if (n && Number(n) > 0) {
      return Array.from({length: Number(n)}, (_, i) => `Semestre ${i+1}`);
    }
    // último recurso: si plan.text incluye (8) no confiar; devolvemos vacío
    return [];
  }

  // UI
  return (
    <div>
      {/* Select de planes */}
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Plan del estudio</label>
        <select
          className="form-select"
          value={selectedPlanIdx === null ? '' : selectedPlanIdx}
          onChange={handlePlanChange}
        >
          <option value="">-- Selecciona un plan --</option>
          {plans && plans.length > 0 && plans.map((pl, i) => (
            <option key={pl.value ?? i} value={i}>
              { (pl.text || pl.nombre || pl.name || `Plan ${i+1}`) }
            </option>
          ))}
        </select>
      </div>

      {/* Checkbox de periodos/semestres */}
      {selectedPlanIdx !== null && selectedPlanIdx !== undefined ? (
        (() => {
          const plan = plans[selectedPlanIdx];
          const labels = getPeriodLabelsForPlan(plan);
          if (!labels || labels.length === 0) {
            return (<div className="text-muted">Este plan no contiene información de periodos.</div>);
          }
          return (
            <div>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Selecciona periodos / semestres</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {labels.map((lab, idx) => {
                  const value = plan.periodos && plan.periodos[idx] ? (plan.periodos[idx].value ?? lab ?? idx) : idx;
                  const checked = (selectedPeriods || []).some(p => p === value);
                  return (
                    <div key={idx} style={{ minWidth: 110 }}>
                      <div className="form-check">
                        <input
                          id={`plan-period-${idx}`}
                          className="form-check-input"
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePeriod(value)}
                        />
                        <label className="form-check-label" htmlFor={`plan-period-${idx}`} style={{ fontSize: 13 }}>
                          { lab }
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()
      ) : (
        <div className="text-muted">Selecciona primero un plan para ver los periodos / semestres.</div>
      )}
    </div>
  );
}
