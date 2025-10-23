// src/App.js
import React from 'react'
import { Route, Routes } from 'react-router-dom'
import HomePage from "./pages/homepage/homepage";
import Generator from './pages/generator/Generator';
import Profesor from './pages/profesor/Profesor';
import Login from './pages/Login'; // <-- nuevo import (resuelve index.jsx dentro de Login/)
import { HashRouter } from 'react-router-dom';

import './app.css'

function App() {
  return (
      <HashRouter>
        <Routes>
          {/* Ahora la ruta raíz muestra el Login */}
          <Route path='/' exact Component={Login} />

          {/* Puedes seguir accediendo al Home en /home si lo necesitas */}
          <Route path='/home' Component={HomePage} />

          {/* Rutas existentes */}
          <Route path='/generator' Component={Generator} />
          <Route path='/profesor/:name' Component={Profesor} />
        </Routes>
      </HashRouter>
  );
}

export default App;
