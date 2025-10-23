import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  mode: 'generated',
  generatedSchedules: [],
  schedules: [],
  schedulePicked: null,
  savedSchedules: [],
};

export const pickerSlice = createSlice({
  name: 'picker',
  initialState,
  reducers: {
    setSchedules: (state, action) => {
      state.schedules = action.payload;
    },
    pickSchedule: (state, action) => {
      state.schedulePicked = action.payload;
    },
    switchToSavedShedules: (state) => {
      state.mode = 'saved';
      state.schedules = state.savedSchedules;
    },
    switchToGeneratedSchedules:(state) => {
      state.mode = 'generated'
      state.schedules = state.generatedSchedules;
    },
    setSavedSchedules: (state, action) => {
      state.savedSchedules = action.payload;
    },
    setGeneratedSchedules: (state, action) => {
      state.generatedSchedules = action.payload;
    },
    addSavedSchedule: (state, action) => {
      state.savedSchedules.push(action.payload);
    },
    removeSavedSchedule: (state, action) => {
      state.savedSchedules.splice(state.savedSchedules.indexOf(action.payload), 1);
    }
  }
});


export const {
  setSchedules,
  pickSchedule,
  switchToGeneratedSchedules,
  switchToSavedShedules,
  setGeneratedSchedules,
  setSavedSchedules,
  addSavedSchedule,
  removeSavedSchedule,
} = pickerSlice.actions;
export default pickerSlice.reducer;