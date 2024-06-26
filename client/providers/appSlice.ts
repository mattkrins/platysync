import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';
import { navigate } from "wouter/use-browser-location";
import axios, { AxiosError } from 'axios';
import { startLoading, stopLoading } from './loadSlice';

interface app {
  application: string;
  version: string;
  setup: boolean;
}

interface appState extends app {
  auth: { username: string };
  settings: Partial<Settings>;
  schemas: Schema[];
}

const initialState: appState = {
  application: '',
  version: '',
  setup: true,
  schemas: [],
  auth: { username: '' },
  settings: {
    logLevel: 'info',
    enableRun: false,
  },
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    init(_, { payload: { application, version, setup } }: PayloadAction<app>) {
      return { ...initialState, application, version, setup }
    },
    mutate(state, { payload }: PayloadAction<Partial<appState>>) { return { ...state, ...payload }; },
  },
  selectors: {
    isSetup: state => state.setup,
    getVersion: state => state.version,
    getSetup: state => state.setup,
    getSchemas: state => state.schemas,
    getUser: state => state.auth,
  },
});

export default appSlice;

export const { isSetup, getVersion, getSetup, getSchemas, getUser } = appSlice.selectors;

export const loadApp = () => async (dispatch: Dispatch) => {
  dispatch(startLoading("App"));
  try {
    const { data } = await axios<app>({ url: '/api/v1' });
    dispatch(appSlice.actions.mutate(data));
    return data.setup;
  } finally {
    dispatch(stopLoading("App"));
  }
}

const load = (name: string) => async (dispatch: Dispatch) => {
  dispatch(startLoading(name));
  try {
    const { data } = await axios({ url: `/api/v1/${name.toLowerCase()}` });
    dispatch(appSlice.actions.mutate({ [name.toLowerCase()]: data }));
    return data;
  } catch (e) {
    const response = (e as {response?: AxiosError}).response;
    if (response?.status === 401) navigate("/logout", { replace: true });
  } finally {
    dispatch(stopLoading(name));
  }
}

export const loadSettings = () => load("Settings" );
export const loadSchemas = () => load("Schemas" );
export const loadUser = () => load("Auth" );