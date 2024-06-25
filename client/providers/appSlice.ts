import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';
import { navigate } from "wouter/use-browser-location";
import axios, { AxiosError } from 'axios';
import { RootState } from './store';
import { startLoading, stopLoading } from './loadSlice';

interface app {
  application: string;
  version: string;
  setup: boolean;
}

interface appState extends app {
  schemas: Schema[];
  settings: Partial<Settings>;
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
  settings: {
    logLevel: 'info',
    enableRun: false,
  },
  loadingApp: false,
  loadingSchemas: false,
  loadingUser: false,
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

const load = (name: string) => async (dispatch: Dispatch) => {
  dispatch(startLoading(name));
  try {
    const { data } = await axios({ url: `/api/v1/${name.toLowerCase()}` });
    dispatch(appSlice.actions.mutate({ [name.toLowerCase()]: data }));
    return data;
  } finally {
    dispatch(stopLoading(name));
  }
}

export const loadSettings = () => load("Settings" );
//TODO - convert the rest and use settings slice in app

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

