import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';
import { navigate } from "wouter/use-browser-location";
import axios, { AxiosError } from 'axios';
import { startLoading, stopLoading } from './loadSlice';
import { RootState } from './store';

interface app {
  application: string;
  version: string;
  setup: boolean;
}

interface appState extends app {
  auth: { username: string, expires?: string };
  settings: Partial<Settings>;
  schemas: Schema[];
  dictionary: kvPair[];
  secrets: encryptedkvPair[];
  error?: Error;
  active?: string;
  newVersion?: string;
}

const initialState: appState = {
  application: '',
  version: '',
  setup: true,
  schemas: [],
  dictionary: [],
  secrets: [],
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
    reorder(state, { payload: { name, to, from } }: PayloadAction<{name: string, to: number, from: number}>) {
      const array = state[name as keyof appState] as unknown[];
      const to_value = array[to];
      const from_value = array[from];
      array[from] = to_value;
      array[to] = from_value;
    },
  },
  selectors: {
    isLoaded: state => !!state.application,
    isSetup: state => state.setup,
    getError: state => state.error,
    getVersion: state => state.version,
    getDictionary: state => state.dictionary,
    getSecrets: state => state.secrets,
    getLatestVersion: state => state.newVersion,
    getSetup: state => state.setup,
    getSchemas: state => state.schemas,
    getUser: state => state.auth,
    getAuthed: state => !!state.auth.username,
    getSettings: state => state.settings,
  },
});

export default appSlice;

export const { login, logout } = appSlice.actions;
export const { isLoaded, isSetup, getError, getVersion, getDictionary, getSecrets, getSetup, getSchemas, getUser, getSettings, getLatestVersion } = appSlice.selectors;

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

export const checkVersion = () => async (dispatch: Dispatch) => {
  dispatch(startLoading("Version"));
  try {
    const { data: releases } = await axios<{name: string}[]>({
      headers: {'X-GitHub-Api-Version': '2022-11-28'},
      url: "https://api.github.com/repos/mattkrins/platysync/releases",
    });
    const { name: newVersion } = releases[0];
    dispatch(appSlice.actions.mutate({ newVersion }));
    return newVersion;
  } finally {
    dispatch(stopLoading("Version"));
  }
}

export const reorder = (payload: {name: string, to: number, from: number, url?: string}) => async (dispatch: Dispatch) => {
  const { name, to, from, url } = payload;
  if (to===from) return;
  dispatch(appSlice.actions.reorder(payload));
  dispatch(startLoading(`${name}_${to}`));
  dispatch(startLoading(`${name}_${from}`));
  try {
    await axios({
      url: `/api/v1/${url?url:`${name}/reorder`}`,
      method: "post", data: payload
    });
} finally {
    dispatch(stopLoading(`${name}_${to}`));
    dispatch(stopLoading(`${name}_${from}`));
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
export const loadDictionary = () => load("Dictionary" );
export const loadSecrets = () => load("Secrets");
export const loadUser = () => load("Auth" );