import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';

interface SchemaState extends Schema {
  prev?: SchemaState;
}

const initialState: SchemaState = {
  name: '', version: '', connectors: [], rules: [],
  prev: { name: '', version: '', connectors: [], rules: [] }
};

const schemaSlice = createSlice({
  name: 'schema',
  initialState,
  reducers: {
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
    schema: state => state,
    name: state => state.name,
    version: state => state.version,
  },
});

export const { mutate, undo } = schemaSlice.actions;
export const { schema, name, version } = schemaSlice.selectors;

export default schemaSlice;

export const loadSchema = (name: string) => async (dispatch: Dispatch, getState: ()=> RootState) => {
  const { app: { schemas } } = getState();
  const schema = schemas.find(s=>s.name===name);
  if (!schema) throw Error("Schema does not exist.");
  dispatch(schemaSlice.actions.setSchema(schema));
}
