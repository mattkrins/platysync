import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';

interface loadState { [k: string]: boolean }

const initialState: loadState = {};

const loadSlice = createSlice({
  name: 'load',
  initialState,
  reducers: {
    startLoading(state, { payload }: PayloadAction<Partial<string>>) { state[`loading${payload}`] = true; },
    stopLoading(state, { payload }: PayloadAction<Partial<string>>) { delete state[`loading${payload}`]; },
  },
});

export default loadSlice;

export const { startLoading, stopLoading } = loadSlice.actions;
export const loading = (id: string) => (state: RootState) => state.load[id] || false;