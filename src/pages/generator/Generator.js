// src/pages/generator/Generator.js
import React from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import './generator.css';          // si tienes estilos viejos, se siguen aplicando
import './generator.layout.css';   // <-- nuevo layout

import SchedulePicker from './Components/picker/SchedulePicker';
import ScheduleViwer from './Components/viwer/ScheduleViwer';
import ScheduleGenerationForm from './Components/form/ScheduleGenerationForm';

const Generator = () => {
  return (
    <div className="gen-layout">
      {/* Columna izquierda: Horario + Horarios generados */}
      <div className="gen-left">
        {/* Aquí dentro va el componente que muestra el calendario */}
        <div className="gen-card-block">
          <ScheduleViwer />
        </div>

        {/* Debajo: el módulo “Horarios generados” */}
        <div className="gen-card-block">
          <SchedulePicker />
        </div>
      </div>

      {/* Columna derecha: Ajustes */}
      <div className="gen-right">
        <div className="gen-card-block">
          <ScheduleGenerationForm />
        </div>
      </div>
    </div>
  );
};

export default Generator;
