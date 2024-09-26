import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';
import axios from 'axios';
import { startLoading, stopLoading } from './loadSlice';

export const initialState: Schema = {
  name: '',
  version: '',
  files: [],
  connectors: [],
  rules: [],
  actions: [],
  schedules: [],
};

const schemaSlice = createSlice({
  name: 'schema',
  initialState,
  reducers: {
    init() { return initialState; },
    setSchema(_, { payload }: PayloadAction<Schema>) { return { ...initialState, ...payload }; },
    mutate(state, { payload }: PayloadAction<Partial<Schema>>) { return { ...state, ...payload }; },
    reorder(state, { payload: { name, to, from } }: PayloadAction<{name: string, to: number, from: number}>) {
      const array = state[name as keyof Schema] as unknown[];
      const to_value = array[to];
      const from_value = array[from];
      array[from] = to_value;
      array[to] = from_value;
    },
  },
  selectors: {
    getName: state => state.name,
    getVersion: state => state.version,
    getFiles: state => state.files,
    getActions: state => state.actions,
    getConnectors: state => state.connectors,
    getRules: state => state.rules,
    getSchedules: state => state.schedules,
  },
});

export const { init, mutate } = schemaSlice.actions;
export const { getName, getVersion, getFiles, getConnectors, getRules, getActions, getSchedules, } = schemaSlice.selectors;

export default schemaSlice;

export const reorder = (payload: {name: string, to: number, from: number, url?: string}) => async (dispatch: Dispatch, getState: ()=> RootState) => {
  const { name, to, from, url } = payload;
  if (to===from) return;
  dispatch(schemaSlice.actions.reorder(payload));
  const { schema } = getState();
  dispatch(startLoading(`${name}_${to}`));
  dispatch(startLoading(`${name}_${from}`));
  try {
    await axios({
      url: `/api/v1/schema/${schema.name}/${url?url:`${name}/reorder`}`,
      method: "post", data: payload
    });
} finally {
    dispatch(stopLoading(`${name}_${to}`));
    dispatch(stopLoading(`${name}_${from}`));
  }
}

export const loadSchema = (name: string) => async (dispatch: Dispatch, getState: ()=> RootState) => {
  const { app: { schemas } } = getState();
  const schema = schemas.find(s=>s.name===name);
  if (!schema) throw Error("Schema does not exist.");
  dispatch(schemaSlice.actions.setSchema(schema));
}

const load = (name: string) => async (dispatch: Dispatch, getState: ()=> RootState) => {
  dispatch(startLoading(name));
  try {
    const { schema } = getState();
    const { data } = await axios({ url: `/api/v1/schema/${schema.name}/${name.toLowerCase()}` });
    dispatch(schemaSlice.actions.mutate({ [name.toLowerCase()]: data }));
    return data;
  } finally {
    dispatch(stopLoading(name));
  }
}

export const loadFiles = () => load("Files");
export const loadActions = () => load("Actions");
export const loadRules = () => load("Rules");
export const loadConnectors = () => load("Connectors");
export const loadSchedules = () => load("Schedules");