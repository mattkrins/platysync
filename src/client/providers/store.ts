import { Action, ThunkAction, combineSlices, configureStore } from '@reduxjs/toolkit';
import schemaSlice from './schemaSlice';
import appSlice from './appSlice';
import loadSlice from './loadSlice';

const rootReducer = combineSlices(schemaSlice, appSlice, loadSlice)
const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore["dispatch"];
export type AppStore = typeof store;
export type AppThunk<ThunkReturnType = void> = ThunkAction<
  ThunkReturnType,
  RootState,
  unknown,
  Action
>;

export default store;
