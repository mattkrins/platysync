import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';
import { getCookie } from "../modules/common";
import axios from 'axios';

interface appState {
  application: string;
  version: string;
  setup: number;
  schemas: Schema[];
  user: { username: string };
  loadingApp: boolean;
  loadingSchemas: boolean;
  loadingUser: boolean;
}

const initialState: appState = {
  application: '',
  version: '',
  setup: 0,
  schemas: [],
  user: { username: '' },
  loadingApp: false,
  loadingSchemas: false,
  loadingUser: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    init(_, action: PayloadAction<appState>) { return action.payload; },
    mutate(state, action: PayloadAction<Partial<appState>>) { return { ...state, ...action.payload }; },
  },
  selectors: {
    getVersion: state => state.version,
    getSetup: state => state.setup,
    getSchemas: state => state.schemas,
    getUser: state => state.user,
  },
});

export default appSlice;

export const { getVersion, getSetup, getSchemas, getUser } = appSlice.selectors;

export const loadApp = () => async (dispatch: Dispatch) => {
  dispatch(appSlice.actions.mutate({loadingApp: true}));
  try {
    const response = await axios({ url: '/api/v1' });
    dispatch(appSlice.actions.init({...initialState, ...response.data as appState}));
  } finally {
    dispatch(appSlice.actions.mutate({loadingApp: false}));
  }
}

export const loadSchemas = () => async (dispatch: Dispatch) => {
  dispatch(appSlice.actions.mutate({loadingSchemas: true}));
  try {
    const response = await axios({ url: '/api/v1/schemas' });
    dispatch(appSlice.actions.mutate({schemas: response.data as Schema[]}));
  } finally {
    dispatch(appSlice.actions.mutate({loadingSchemas: false}));
  }
}

export const loadUser = () => async (dispatch: Dispatch) => {
  dispatch(appSlice.actions.mutate({loadingSchemas: true}));
  try {
    const response = await axios({ url: '/api/v1/auth' });
    dispatch(appSlice.actions.mutate({user: response.data as Session}));
  } finally {
    dispatch(appSlice.actions.mutate({loadingSchemas: false}));
  }
}

