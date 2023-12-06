import React from 'react'
import { ContextProvider as SchemaContext } from './contexts/SchemaContext'
import { ContextProvider as AppContext } from './contexts/AppContext'
import { ContextProvider as ConfirmContext } from './contexts/ConfirmContext'

import Layout from './Layout'

export default function App() {
  return (
      <SchemaContext>
        <AppContext>
          <ConfirmContext>
            <Layout/>
          </ConfirmContext>
        </AppContext>
      </SchemaContext>
  );
}





