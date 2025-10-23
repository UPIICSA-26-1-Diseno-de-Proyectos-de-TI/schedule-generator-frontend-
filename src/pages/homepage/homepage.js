import React from 'react'
import { Link } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css';

const HomePage = () => {
  return (
    <div className='container'>
      <div className='d-flex align-items-center justify-content-center min-vh-100'>
        <div className='text-center'>
          <h1>Generador de horarios</h1>
          <hr className='my-4'/>
          <h3>Busca tu mejor opción para tu horario escolar</h3>
          <Link to='/generator' className='btn btn-primary btn-lg my-3'>¡Generar ahora!</Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;