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
  auth: { username: string, expires?: string };
  settings: Partial<Settings>;
  schemas: Schema[];
  error?: Error;
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
    login(state, { payload }: PayloadAction<Session>) { return { ...state, auth: payload }; },
    logout(state) { return { ...state, auth: initialState.auth }; },
    mutate(state, { payload }: PayloadAction<Partial<appState>>) { return { ...state, ...payload }; },
  },
  selectors: {
    getError: state => state.error,
    isLoaded: state => !!state.application,
    isSetup: state => state.setup,
    getVersion: state => state.version,
    getSetup: state => state.setup,
    getSchemas: state => state.schemas,
    getUser: state => state.auth,
    getAuthed: state => !!state.auth.username,
    getSettings: state => state.settings,
  },
});

export default appSlice;

export const { login, logout } = appSlice.actions;
export const { isLoaded, isSetup, getError, getVersion, getSetup, getSchemas, getUser, getSettings } = appSlice.selectors;

export const loadApp = () => async (dispatch: Dispatch) => {
  dispatch(startLoading("App"));
  try {
    const { data } = await axios<app>({ url: '/api/v1' });
    dispatch(appSlice.actions.mutate(data));
    return data.setup;
  } catch (e) {
    dispatch(appSlice.actions.mutate({error: e as Error}));
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