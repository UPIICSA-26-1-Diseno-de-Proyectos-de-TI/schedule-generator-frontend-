import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  displayedSchedule: null,
}

const viwerSlice = createSlice({
  name: 'viwer',
  initialState,
  reducers: {
    displaySchedule: (state, action) => {
      state.displayedSchedule = action.payload;
    }
  }
});

export const { displaySchedule } = viwerSlice.actions;
export default viwerSlice.reducer; 
