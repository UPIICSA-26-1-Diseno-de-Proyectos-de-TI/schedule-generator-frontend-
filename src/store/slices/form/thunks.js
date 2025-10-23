import { setGeneratedSchedules, setSchedules, switchToGeneratedSchedules } from "../picker/pickerSlice";
import { finishScheduleGeneration, startScheduleGeneration } from "./formSlice"
import axios from 'axios';

export const getSchedules = ( params ) => {
  return async ( dispatch, getState ) => {
    dispatch( startScheduleGeneration() );

    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT;
    try {
      let res = await axios.post(`${apiEndpoint}/schedules/`, {
          "levels":params.semesters,
          "semesters":params.semesters,
          "start_time":params.startTime,
          "end_time":params.endTime,
          "career":params.career,
          "length":params.courseLength,
          "credits":params.credits,
          "available_uses":params.availableUses,
          "excluded_teachers":params.excludedTeachers,
          "excluded_subjects":params.excludedSubjects,
          "extra_subjects":params.extraSubjects,
          "required_subjects":params.requiredSubjects,
      }
      )
      let resJson = await res.data;
      dispatch( setGeneratedSchedules(resJson) );
      dispatch( switchToGeneratedSchedules() );
      dispatch( setSchedules(resJson) );
    } catch (err) {
      dispatch( setSchedules([]) );
      console.error(err.message);
    } finally {
      dispatch( finishScheduleGeneration() );
    }
  }
}
