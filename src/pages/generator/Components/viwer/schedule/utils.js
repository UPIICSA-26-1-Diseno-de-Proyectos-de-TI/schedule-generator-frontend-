/**
 * Crea una matriz vacía para representar un horario basado en las horas y días proporcionados.
 * 
 * @param {string[]} hours - Lista de horas en formato 'HH:MM'.
 * @param {string[]} days - Lista de días de la semana.
 * @returns {Array<Array<null>>} - Una matriz donde cada elemento es inicialmente null.
 */
function createEmptySchedule(hours, days) {
  const schedule = [];
  for (let i = 0; i < hours.length; i++) {
    const row = [];
    for (let j = 0; j < days.length; j++) {
      row.push(null); // Inicialmente vacío
    }
    schedule.push(row);
  }
  return schedule;
}

/**
 * Convierte una lista de cursos en un formato de eventos para mostrar en un horario,
 * asignando colores y manejando atributos adicionales para cada evento.
 * 
 * @param {Object[]} inputCourses - Lista de cursos con su información.
 * @returns {Object} - Un objeto con dos propiedades:
 *                     - schedule: Una matriz con los eventos organizados por hora y día.
 *                     - extraAttributes: Un diccionario con atributos adicionales para cada evento.
 */
function getEventsFromCourses(inputCourses) {
  // Definición de colores posibles para los eventos
  const colors = [
    { bg: 'bg-primary', text: 'text-white' },
    { bg: 'bg-secondary', text: 'text-white' },
    { bg: 'bg-success', text: 'text-black' },
    { bg: 'bg-danger', text: 'text-white' },
    { bg: 'bg-warning', text: 'text-black' },
    { bg: 'bg-info', text: 'text-white' },
    { bg: 'bg-light', text: 'text-black' },
    { bg: 'bg-dark', text: 'text-white' },
    { bg: 'bg-success-subtle', text: 'text-success-emphasis' },
    { bg: 'bg-danger-subtle', text: 'text-danger-emphasis' },
    { bg: 'bg-warning-subtle', text: 'text-warning-emphasis' },
    { bg: 'bg-info-subtle', text: 'text-info-emphasis' },
  ];

  // Definición de las horas del día en incrementos de 30 minutos
  const hours = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  // Definición de los días de la semana
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Crear matriz vacía del horario
  const schedule = createEmptySchedule(hours, days);
  const extraAttributes = {}; // Diccionario para atributos adicionales

  // Mapeo de los días en inglés a español
  const daysMapping = {
    Monday: 'Lunes',
    Tuesday: 'Martes',
    Wednesday: 'Miércoles',
    Thursday: 'Jueves',
    Friday: 'Viernes',
    Saturday: 'Sábado',
  };

  inputCourses.forEach(course => {
    const availableColors = colors.filter(color => !color.usado);

    // Si se acaban los colores, se reinicia su uso
    if (availableColors.length === 0) {
      colors.forEach(color => color.usado = false);
    }

    const selectedColor = availableColors[Math.floor(Math.random() * availableColors.length)];
    selectedColor.usado = true;

    const { teacher, subject, teacher_positive_score, schedule: courseSchedule, sequence, course_availability } = course;

    courseSchedule.forEach(session => {
      const dayIndex = days.indexOf(daysMapping[session.day]);
      const startTimeIndex = hours.indexOf(session.start_time);
      const endTimeIndex = hours.indexOf(session.end_time);

      if (dayIndex !== -1 && startTimeIndex !== -1 && endTimeIndex !== -1) {
        for (let i = startTimeIndex; i < endTimeIndex; i++) {
          const eventKey = `${subject}_${teacher}_${session.start_time}_${session.end_time}`;

          // Guardar atributos adicionales en el diccionario
          extraAttributes[eventKey] = {
            color: selectedColor,
            show: false,
          };

          // Asignar evento en la matriz de horario
          schedule[i][dayIndex] = {
            dia: daysMapping[session.day],
            inicio: session.start_time,
            fin: session.end_time,
            teacher,
            subject,
            sequence,
            positiveScore: teacher_positive_score,
            availability: course_availability,
            key: eventKey, // Añadir la clave para referencia en el diccionario
          };
        }
      }
    });
  });

  return { schedule, extraAttributes };
}

export default getEventsFromCourses;
