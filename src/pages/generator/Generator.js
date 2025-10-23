import React from 'react'

import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import './generator.css'

import SchedulePicker from './Components/picker/SchedulePicker';
import ScheduleViwer from './Components/viwer/ScheduleViwer';
import ScheduleGenerationForm from './Components/form/ScheduleGenerationForm';

const Generator = () => {
  return (
    <div className='row'>
      <div className='container-fluid h-100'>
        <div className='row m-2 my-3' style={{ height: 'auto' }}>
          <div className='col-sm-12 col-lg-9'>
            <ScheduleViwer />
          </div>
          <div className='col-sm-12 col-lg-3'>
            <ScheduleGenerationForm />
          </div>
        </div>
        <div className='row m-2 my-3' style={{ height: '20%' }}>
          <div className='col-sm-12 col-12'>
            <SchedulePicker />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Generator;