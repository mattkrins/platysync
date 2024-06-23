import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';
import { navigate } from "wouter/use-browser-location";
import axios, { AxiosError } from 'axios';
import { RootState } from './store';

interface app {
  application: string;
  version: string;
  setup: boolean;
}

interface appState extends app {
  schemas: Schema[];
  user: { username: string };
  loadingApp: boolean;
  loadingSchemas: boolean;
  loadingUser: boolean;
}

const initialState: appState = {
  application: '',
  version: '',
  setup: true,
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
    init(state, { payload }: PayloadAction<app>) {
      state.application = payload.application;
      state.version = payload.version;
      state.setup = payload.setup;
    },
    mutate(state, { payload }: PayloadAction<Partial<appState>>) { return { ...state, ...payload }; },
  },
  selectors: {
    isSetup: state => state.setup,
    getVersion: state => state.version,
    getSetup: state => state.setup,
    getSchemas: state => state.schemas,
    getUser: state => state.user,
  },
});

export default appSlice;

export const { isSetup, getVersion, getSetup, getSchemas, getUser } = appSlice.selectors;

export const loadApp = () => async (dispatch: Dispatch) => {
  dispatch(appSlice.actions.mutate({loadingApp: true}));
  try {
    const { data } = await axios<app>({ url: '/api/v1' });
    dispatch(appSlice.actions.init(data));
    return data.setup;
  } finally {
    dispatch(appSlice.actions.mutate({loadingApp: false}));
  }
}

export const loadSchemas = () => async (dispatch: Dispatch) => {
  dispatch(appSlice.actions.mutate({loadingSchemas: true}));
  try {
    const response = await axios({ url: '/api/v1/schemas' });
    dispatch(appSlice.actions.mutate({schemas: response.data as Schema[]}));
  } catch (e) {
    const response = (e as {response?: AxiosError}).response;
    if (response?.status === 401) navigate("/logout", { replace: true });
  } finally {
    dispatch(appSlice.actions.mutate({loadingSchemas: false}));
  } 
}

export const loadUser = () => async (dispatch: Dispatch) => {
  dispatch(appSlice.actions.mutate({loadingUser: true}));
  try {
    const response = await axios({ url: '/api/v1/auth' });
    dispatch(appSlice.actions.mutate({user: response.data as Session}));
  } catch (e) {
    const response = (e as {response?: AxiosError}).response;
    if (response?.status === 401) navigate("/logout", { replace: true });
  } finally {
    dispatch(appSlice.actions.mutate({loadingUser: false}));
  }
}

