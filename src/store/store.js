import { configureStore } from "@reduxjs/toolkit";
import formReducer from './slices/form/formSlice'
import pickerReducer from './slices/picker/pickerSlice'
import viwerReducer from './slices/viwer/viwerSlice'

export const store = configureStore({
  reducer: {
    form: formReducer,
    picker: pickerReducer,
    viwer: viwerReducer,
  },
})
