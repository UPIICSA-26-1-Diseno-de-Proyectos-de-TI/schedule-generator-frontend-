import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Session from './Session';

describe('Session Component', () => {
  const mockSession = {
    color: {
      bg: 'bg-primary',
      text: 'text-white',
    },
    sequence: 'ABC123',
    teacher: 'Susy Cuevas Escobar',
    positiveScore: 0.7,
    show: true,
    contenido: 'Comunicación de datos',
    dia: 'Lunes',
    inicio: '07:00',
    fin: '09:00',
    subject: 'Comunicación de datos',
  };

  it('renders without crashing', () => {
    render(<table><tbody><tr><Session session={mockSession} /></tr></tbody></table>);
    expect(screen.getByText('Comunicación de datos')).toBeInTheDocument();
  });

  it('renders session information correctly', () => {
    render(<table><tbody><tr><Session session={mockSession} /></tr></tbody></table>);
    expect(screen.getByText('Comunicación de datos')).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('Susy Cuevas Escobar')).toBeInTheDocument();
    expect(screen.getByText('0.70')).toBeInTheDocument();
  });

  it('renders Session component with correct rowSpan value', () => {
    const example = {
      color: {
        bg: 'bg-primary',
        text: 'text-white',
      },
      sequence: 'ABC123',
      teacher: 'Susy Cuevas Escobar',
      positiveScore: 0.7,
      show: true,
      contenido: 'Comunicación de datos',
      dia: 'Lunes',
      inicio: '07:00',
      fin: '09:00',
      subject: 'Comunicación de datos',
    };

    const tests = [
      {session: {...example, inicio: '07:00', fin: '07:30'}, expected: 1},
      {session: {...example, inicio: '07:00', fin: '08:00'}, expected: 2},
      {session: {...example, inicio: '07:00', fin: '08:30'}, expected: 3},
      {session: {...example, inicio: '07:00', fin: '09:00'}, expected: 4},
      {session: {...example, inicio: '07:00', fin: '09:30'}, expected: 5},
      {session: {...example, inicio: '07:00', fin: '10:00'}, expected: 6},
      {session: {...example, inicio: '07:00', fin: '10:30'}, expected: 7},
    ];

    tests.forEach(({session, expected}) => {
      const { container } = render(<table><tbody><tr><Session session={session} /></tr></tbody></table>);
      const sessionElement = container.querySelector('td');
      const actualRowSpan = sessionElement.getAttribute('rowSpan');

      expect(actualRowSpan).toBe(expected.toString());
    });
  });
});
