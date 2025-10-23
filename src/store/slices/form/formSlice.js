import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  levels: [],
  semesters: [],
  startTime: '07:00',
  endTime: '15:00',
  career: '',
  shifts:["M", "V"],
  courseLength: 7,
  credits: 100,
  availableUses: 1,
  excludedTeachers: [],
  excludedSubjects: [],
  extraSubjects: [],
  requiredSubjects: [],
  isGenerating: false
}

export const formSlice = createSlice({
  name: 'form',
  initialState,
  reducers: {
    addSemester: (state, action) => {
      state.semesters.push(action.payload)
    },
    removeSemester: (state, action) => {
      state.semesters.splice(state.semesters.indexOf(action.payload), 1)
    },
    addLevel: (state, action) => {
      state.levels.push(action.payload)
    },
    removeLevel: (state, action) => {
      state.levels.splice(state.levels.indexOf(action.payload), 1)
    },
    changeStartTime: (state, action) => {
      state.startTime = action.payload
    },
    changeEndTime: (state, action) => {
      state.endTime = action.payload
    },
    setCareer: (state, action) => {
      state.career = action.payload
    },
    changeCourseLength: (state, action) => {
      state.courseLength = action.payload
    },
    changeCredits: (state, action) => {
      state.credits = action.payload
    },
    changeAvailableUses: (state, action) => {
      state.availableUses = action.payload
    },
    addExcludedTeachers: (state, action) => {
      state.excludedTeachers.push(action.payload);
    },
    removeExcludedTeachers: (state, action) => {
      state.excludedTeachers.splice(state.excludedTeachers.indexOf(action.payload), 1)
    },
    addExcludedSubjects: (state, action) => {
      state.excludedSubjects.push(action.payload);
    },
    removeExcludedSubjects: (state, action) => {
      state.excludedSubjects.splice(state.excludedSubjects.indexOf(action.payload), 1)
    },
    addExtraSubject: (state, action) => {
      state.extraSubjects.push(action.payload)
    },
    removeExtraSubject: (state, action) => {
      state.extraSubjects.splice(state.extraSubjects.indexOf(action.payload), 1)
    },
    addRequiredSubject: (state, action) => {
      state.requiredSubjects.push(action.payload)
    },
    removeRequiredSubject: (state, action) => {
      state.requiredSubjects.splice(state.requiredSubjects.indexOf(action.payload), 1)
    },
    startScheduleGeneration: (state) => {
      state.isGenerating = true
    },
    finishScheduleGeneration: (state) => {
      state.isGenerating = false
    }
  },
})

export const {
  addSemester,
  removeSemester,
  addLevel,
  removeLevel,
  changeStartTime,
  changeEndTime,
  setCareer,
  changeCourseLength,
  changeCredits,
  changeAvailableUses,
  addExcludedTeachers,
  removeExcludedTeachers,addExcludedSubjects,
  removeExcludedSubjects, addExtraSubject,
  removeExtraSubject,
  addRequiredSubject,
  removeRequiredSubject,
  startScheduleGeneration,
  finishScheduleGeneration
} = formSlice.actions

export default formSlice.reducer