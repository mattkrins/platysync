import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';
import axios from 'axios';
import { startLoading, stopLoading } from './loadSlice';

const initialState: Schema = {
  name: '',
  version: '',
  files: [],
  connectors: [],
  rules: [],
};

const schemaSlice = createSlice({
  name: 'schema',
  initialState,
  reducers: {
    init() { return initialState; },
    setSchema(_, { payload }: PayloadAction<Schema>) { return { ...payload }; },
    mutate(state, { payload }: PayloadAction<Partial<Schema>>) { return { ...state, ...payload }; },
  },
  selectors: {
    getName: state => state.name,
    getVersion: state => state.version,
    getFiles: state => state.files,
    getConnectors: state => state.connectors,
    getRules: state => state.rules,
  },
});

export const { init, mutate } = schemaSlice.actions;
export const { getName, getVersion, getFiles, getConnectors, getRules } = schemaSlice.selectors;

export default schemaSlice;

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

export const loadFiles = () => load("Files" );
export const loadRules = () => load("Rules" );
export const loadConnectors = () => load("Connectors" );