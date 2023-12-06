import React, { useEffect, useState } from 'react'
import { Container } from 'semantic-ui-react'
import { UseSchemaContext } from './contexts/SchemaContext'

import Navigation from './components/Navigation'
import Dashboard from './Dashboard'
import Settings from './Settings'
import AddSchema from './AddSchema'
import Schema from './Schema'
import Inputs from './Input'
import Templates from './Templates'
import Rules from './Rules'

export default function App() {
    const { setSchemaName } = UseSchemaContext();
    const { schemaName, tab, NavigationJSX, refreshSchemas, setTab, setSchema, schemas } = Navigation();
    const [ action, setAction ] = useState(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(()=>{ if (schemaName) setSchemaName(schemaName) }, [ schemaName ] )
    return (
    <Container fluid>
        {NavigationJSX}
        {tab==='Dashboard'&&<Dashboard schemaName={schemaName} schemas={schemas} nav={action} setNav={setAction} />}
        {tab==='Settings'&&<Settings/>}
        {tab==='NewSchema'&&<AddSchema refreshSchemas={refreshSchemas} setSchema={setSchema} setTab={setTab} />}
        {tab==='Schema'&&<Schema schemaName={schemaName} setSchema={setSchema} refreshSchemas={refreshSchemas} />}
        {tab==='Input'&&<Inputs schemaName={schemaName} />}
        {tab==='Templates'&&<Templates schemaName={schemaName} />}
        {tab==='Rules'&&<Rules schemaName={schemaName} />}
    </Container>
    );
}