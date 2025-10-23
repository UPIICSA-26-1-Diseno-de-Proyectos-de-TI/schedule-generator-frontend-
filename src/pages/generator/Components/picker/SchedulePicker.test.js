import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

import SchedulePicker from './SchedulePicker';
import { pickSchedule } from '../../../../store/slices/picker/pickerSlice';

const mockStore = configureStore([]);

const scheduleOptions = [{
  "courses": [
    {
      "id": "5",
      "sequence": "4CM40",
      "teacher": "GUERRERO HUERTA ARACELI",
      "subject": "MODELOS DETERMINISTICOS DE INVESTIGACIÓN DE OPERACIONES",
      "course_availability": 40,
      "teacher_popularity": 0.7344444444444445,
      "required_credits": 7.0,
      "schedule": {
        "monday": [
          "13:00",
          "15:00"
        ],
        "tuesday": null,
        "wednesday": [
          "13:00",
          "15:00"
        ],
        "thursday": null,
        "friday": null
      }
    },
    {
      "id": "7",
      "sequence": "4CM41",
      "teacher": "PEREZ ALTAMIRANO ERIC",
      "subject": "ESTADÍSTICA",
      "course_availability": 40,
      "teacher_popularity": 0.8216666666666667,
      "required_credits": 7.0,
      "schedule": {
        "monday": null,
        "tuesday": null,
        "wednesday": [
          "11:00",
          "13:00"
        ],
        "thursday": null,
        "friday": [
          "11:00",
          "13:00"
        ]
      }
    },
    {
      "id": "8",
      "sequence": "4CM41",
      "teacher": "MENDEZ GARCIA SARA",
      "subject": "TEORÍA DE COMPUTACIÓN Y COMPILADORES",
      "course_availability": 40,
      "teacher_popularity": 0.4141666666666667,
      "required_credits": 7.0,
      "schedule": {
        "monday": [
          "10:00",
          "12:00"
        ],
        "tuesday": null,
        "wednesday": null,
        "thursday": [
          "10:00",
          "12:00"
        ],
        "friday": null
      }
    },
  ],
  "popularity": 0.5791291644863074,
  "total_credits_required": 44.0
}, {
  "courses": [{
    "id": "9",
    "sequence": "4CM41",
    "teacher": "ENTZANA GARDUÑO YVENTZ",
    "subject": "DISEÑO DE BASES DE DATOS",
    "course_availability": 40,
    "teacher_popularity": 0.505,
    "required_credits": 7.0,
    "schedule": {
      "monday": null,
      "tuesday": null,
      "wednesday": [
        "09:00",
        "11:00"
      ],
      "thursday": null,
      "friday": [
        "09:00",
        "11:00"
      ]
    }
  },
  {
    "id": "10",
    "sequence": "4CM41",
    "teacher": "CHAVEZ LOPEZ RAMON",
    "subject": "CONSTRUCCIÓN DE SOFTWARE",
    "course_availability": 40,
    "teacher_popularity": 0.5861904761904762,
    "required_credits": 5.0,
    "schedule": {
      "monday": [
        "07:00",
        "08:00"
      ],
      "tuesday": null,
      "wednesday": null,
      "thursday": [
        "07:00",
        "09:00"
      ],
      "friday": null
    }
  },
  {
    "id": "11",
    "sequence": "4CM41",
    "teacher": "VELASCO CONTRERAS JOSE ANTONIO",
    "subject": "COMUNICACIÓN DE DATOS",
    "course_availability": 40,
    "teacher_popularity": 0.3007692307692308,
    "required_credits": 6.0,
    "schedule": {
      "monday": null,
      "tuesday": null,
      "wednesday": [
        "07:00",
        "09:00"
      ],
      "thursday": null,
      "friday": [
        "07:00",
        "09:00"
      ]
    }
  },
  {
    "id": "13",
    "sequence": "4CM41",
    "teacher": "GONSEN HUERTA RICARDO ISAY",
    "subject": "CONTABILIDAD Y COSTOS",
    "course_availability": 40,
    "teacher_popularity": 0.6916666666666667,
    "required_credits": 5.0,
    "schedule": {
      "monday": [
        "08:00",
        "10:00"
      ],
      "tuesday": null,
      "wednesday": null,
      "thursday": [
        "09:00",
        "10:00"
      ],
      "friday": null
    }
  }],
  "popularity": 0.5791291644863074,
  "total_credits_required": 44.0
}];

describe('SchedulePicker', () => {
  it('renders SchedulePicker component', () => {

    const store = mockStore({
      picker: {
        mode: 'generated',
        generatedSchedules: scheduleOptions,
        schedules: scheduleOptions,
        schedulePicked: null,
        savedSchedules: [],
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <SchedulePicker />
      </Provider>
    );

    expect(getByText('Horarios generados')).toBeInTheDocument();
  });

  it('handles schedule selection', () => {
    const store = mockStore({
      picker: {
        mode: 'generated',
        generatedSchedules: scheduleOptions,
        schedules: scheduleOptions,
        schedulePicked: null,
        savedSchedules: [],
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <SchedulePicker />
      </Provider>
    );

    fireEvent.click(getByText('1'));

    const actions = store.getActions();
    expect(actions).toEqual([pickSchedule(scheduleOptions[0])]);
  });

  it('correct number of schedules', () => {
    const store = mockStore({
      picker: {
        mode: 'generated',
        generatedSchedules: scheduleOptions,
        schedules: scheduleOptions,
        schedulePicked: null,
        savedSchedules: [],
      },
    });

    const { container } = render(
      <Provider store={store}>
        <SchedulePicker />
      </Provider>
    );

    const optionsNumber = container.getElementsByClassName('opcion').length;

    expect(optionsNumber).toEqual(2);
  })
});
