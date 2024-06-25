import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';
import axios from 'axios';
import { startLoading, stopLoading } from './loadSlice';

const initialState: Schema = {
  name: '',
  version: '',
  connectors: [],
  rules: [],
  files: [],
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
    getConnectors: state => state.connectors,
    getRules: state => state.rules,
    getFiles: state => state.files,
  },
});

export const { init, mutate } = schemaSlice.actions;
export const { getName, getVersion, getConnectors, getRules, getFiles } = schemaSlice.selectors;

export default schemaSlice;

export const loadSchema = (name: string) => async (dispatch: Dispatch, getState: ()=> RootState) => {
  const { app: { schemas } } = getState();
  const schema = schemas.find(s=>s.name===name);
  if (!schema) throw Error("Schema does not exist.");
  dispatch(schemaSlice.actions.setSchema(schema));
}

export const loadFiles = (schema_name: string) => async (dispatch: Dispatch) => {
  dispatch(startLoading('Files'));
  try {
    const { data } = await axios<psFile[]>({ url: `/api/v1/schema/${schema_name}/files` });
    dispatch(schemaSlice.actions.mutate({files: data}));
    return data;
  } finally {
    dispatch(stopLoading('Files'));
  }
}
