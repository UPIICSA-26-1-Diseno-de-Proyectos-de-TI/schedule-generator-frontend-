import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom';
import ScheduleViwer from './ScheduleViwer';
import { displaySchedule } from '../../../../store/slices/viwer/viwerSlice';

const mockStore = configureStore([]);
describe('ScheduleViewer Component', () => {

  it('renders without crashing', () => {
    const store = mockStore({
      viwer: {
        displayedSchedule: null,
      },
      picker: {
        schedulePicked: null
      }
    });

    const { getByText } = render(
      <Provider store={store}>
        <ScheduleViwer />
      </Provider>
    );

    const actions = store.getActions();
    expect(actions).toEqual([displaySchedule(null)]);
    expect(screen.getByText('Horario')).toBeInTheDocument();
  });

  it('displays schedule information when a schedule is selected', async () => {
    const scheduleSelected = 
      {
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
          {
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
          }
        ],
        "popularity": 0.5791291644863074,
        "total_credits_required": 44.0
      };

    const store = mockStore({
      viwer: {
        displayedSchedule: scheduleSelected,
      },
      picker: {
        schedulePicked: scheduleSelected,
      }
    });

    const { getByText } = render(
      <Provider store={store}>
        <ScheduleViwer />
      </Provider>
    );

    const actions = store.getActions();
    expect(actions).toEqual([displaySchedule(scheduleSelected)]);

    await waitFor(() => {
      const displayedScheduleElement = getByText(
        `Popularidad: ${scheduleSelected.popularity.toFixed(4)} | Total de creditos requerido: ${scheduleSelected.total_credits_required}`
      );
      expect(displayedScheduleElement).toBeInTheDocument();
    });
  });
  
  it('displays default information when no schedule is selected', async() => {
    const store = mockStore({
      viwer: {
        displayedSchedule: null,
      },
      picker: {
        schedulePicked: null,
      }
    });

    const { getByText } = render(
      <Provider store={store}>
        <ScheduleViwer />
      </Provider>
    );

    const actions = store.getActions();
    expect(actions).toEqual([displaySchedule(null)]);

    await waitFor(() => {
      const displayedScheduleElement = getByText(
        `Popularidad: 0.0000 | Total de creditos requerido: 0`
      );
      expect(displayedScheduleElement).toBeInTheDocument();
    });
  });
});