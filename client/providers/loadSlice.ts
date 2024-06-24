import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface loadState { [k: string]: boolean }

const initialState: loadState = {};

const loadSlice = createSlice({
  name: 'load',
  initialState,
  reducers: {
    startLoading(state, { payload }: PayloadAction<Partial<string>>) { state[payload] = true; },
    stopLoading(state, { payload }: PayloadAction<Partial<string>>) { state[payload] = false; },
  },
  selectors: {
    loading: (state) => state,
  },
});

export default loadSlice;

export const { startLoading, stopLoading } = loadSlice.actions;
export const { loading } = loadSlice.selectors;

