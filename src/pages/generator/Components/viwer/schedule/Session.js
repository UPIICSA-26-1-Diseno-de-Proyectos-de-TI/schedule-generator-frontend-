import React from 'react';
import './session.css'
import { Link } from 'react-router-dom'

const Session = ({ session }) => {

  return (
    <td rowSpan={session.rowSpan} className={`${session.color.bg} ${session.color.text} p-auto`} key={session.key}>
      <p className='text-center text-uppercase fw-semibold m-1 fs-6 lh-sm'>{session.subject}</p>
      <p className='text-center text-uppercase font-monospace m-1 fs-6 lh-sm'>{session.sequence}</p>
      <p className='text-center text-capitalize fw-medium m-1 fs-6 lh-sm'>
        <Link to={`/profesor/${session.teacher}`} target="_blank" >{session.teacher}</Link>
      </p>
      <p className='text-center m-1 fs-6 lh-sm'>{session.positiveScore.toFixed(2)}</p>
      <p className='text-center m-1 fs-6 lh-sm'>Lugares: {session.availability}</p>
    </td>
  );
};

export default Session;