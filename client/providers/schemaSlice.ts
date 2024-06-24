import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';
import axios from 'axios';
import { startLoading, stopLoading } from './loadSlice';

interface SchemaState extends Schema {
  prev?: SchemaState;
}

const initialState: SchemaState = {
  name: '', version: '', connectors: [], rules: [], files: [],
  prev: { name: '', version: '', connectors: [], rules: [], files: [] }
};

const schemaSlice = createSlice({
  name: 'schema',
  initialState,
  reducers: {
    init() { return initialState; },
    setSchema(_, action: PayloadAction<SchemaState>) {
      const { prev, ...payload } = action.payload;
      return { ...payload, prev: payload };
    },
    mutate(state, action: PayloadAction<Partial<SchemaState>>) {
      return { ...state, ...action.payload, prev: (({prev, ...s})=>s)(state) };
    },
    undo(state) {
      const {prev, ...prev_state} = state.prev||initialState;
      return { ...prev_state, prev: prev_state };
    },
  },
  selectors: {
    getName: state => state.name,
    getVersion: state => state.version,
    getConnectors: state => state.connectors,
    getRules: state => state.rules,
    getFiles: state => state.files,
  },
});

export const { mutate, undo, init } = schemaSlice.actions;
export const { getName, getVersion, getConnectors, getRules, getFiles } = schemaSlice.selectors;

export default schemaSlice;

export const loadSchema = (name: string) => async (dispatch: Dispatch, getState: ()=> RootState) => {
  const { app: { schemas } } = getState();
  const schema = schemas.find(s=>s.name===name);
  if (!schema) throw Error("Schema does not exist.");
  dispatch(schemaSlice.actions.setSchema(schema));
}

export const loadFiles = (schema_name: string) => async (dispatch: Dispatch) => {
  dispatch(startLoading('schemas'));
  try {
    const { data } = await axios<psFile[]>({ url: `/api/v1/schema/${schema_name}/files` });
    dispatch(schemaSlice.actions.mutate({files: data}));
    return data;
  } finally {
    dispatch(stopLoading('schemas'));
  }
}
