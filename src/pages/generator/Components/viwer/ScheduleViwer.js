// src/pages/generator/Components/viwer/ScheduleViwer.js
import React, { useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Schedule from "./schedule/Schedule";
import { useDispatch, useSelector } from "react-redux";
import { displaySchedule } from "../../../../store/slices/viwer/viwerSlice";
import { useReactToPrint } from "react-to-print";
import { addSavedSchedule } from "../../../../store/slices/picker/pickerSlice";

const ScheduleViwer = () => {
  const dispatch = useDispatch();
  const schedulePicked = useSelector((state) => state.picker.schedulePicked);
  const displayedSchedule = useSelector(
    (state) => state.viwer.displayedSchedule
  );

  // Cuando cambia el horario seleccionado en el picker, lo mostramos.
  // Si schedulePicked es null, limpiamos el horario mostrado.
  useEffect(() => {
    if (schedulePicked) {
      dispatch(displaySchedule(schedulePicked));
    } else {
      // limpiar el viewer cuando no hay horario seleccionado
      dispatch(displaySchedule(null));
    }
  }, [schedulePicked, dispatch]);

  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  const handleSave = () => {
    if (displayedSchedule) {
      dispatch(addSavedSchedule(displayedSchedule));
    }
  };

  const popularity =
    displayedSchedule &&
    typeof displayedSchedule.avg_positive_score === "number"
      ? displayedSchedule.avg_positive_score
      : displayedSchedule &&
        typeof displayedSchedule.popularity === "number"
      ? displayedSchedule.popularity
      : 0;

  const popularityText = popularity.toFixed(4);
  const totalCredits =
    (displayedSchedule && displayedSchedule.total_credits_required) || 0;

  return (
    <div className="card shadow-sm px-3 py-0 h-100">
      <div className="card-body px-2 py-3 d-flex flex-column">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h4 className="card-title mb-0">Horario</h4>
          <div className="d-flex">
            <button
              type="button"
              className="btn btn-outline-primary mx-1"
              onClick={handlePrint}
              disabled={!displayedSchedule}
              data-toggle="tooltip"
              data-placement="bottom"
              title="Imprimir"
            >
              <i className="bi bi-printer fw-medium"></i>
            </button>
            <button
              type="button"
              className="btn btn-outline-primary mx-1"
              onClick={handleSave}
              disabled={!displayedSchedule}
              data-toggle="tooltip"
              data-placement="bottom"
              title="Guardar horario"
            >
              <i className="bi bi-floppy fw-medium"></i>
            </button>
          </div>
        </div>

        <hr
          className="mb-3 mt-1 text-gray-100 bg-dark shadow-sm"
          style={{ width: "85%", margin: "0 auto" }}
        />

        <div className="flex-grow-1 mb-2">
          {displayedSchedule ? (
            <Schedule selectedSchedule={displayedSchedule} ref={componentRef} />
          ) : (
            <div className="h-100 d-flex align-items-center justify-content-center text-muted text-center px-3">
              No hay horario seleccionado todavía.<br />
              Genera horarios y elige uno en la parte superior.
            </div>
          )}
        </div>

        <div className="row text-end w-100">
          <div className="col-12">
            <span className="d-inline">
              <p className="mb-0">
                Popularidad: {popularityText} | Total de créditos requerido:{" "}
                {totalCredits}
              </p>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleViwer;
