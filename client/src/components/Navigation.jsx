import React, { useState, useEffect } from 'react'
import { Container, Menu, Image, Dropdown, Message } from 'semantic-ui-react'

import useFetch from '../hooks/useFetch'

export default function Navigation() {
    const [ schema, setSchema ] = useState(false);
    const [ tab, setTab ] = useState("Dashboard");
    const { data: schemas, fetch: refresh, loading: loadingSchemas, error } = useFetch({
      url: "/schema", fetch: true, default: [], reset: false
    });
    useEffect(()=>{ if (!schema) {setTab("Dashboard")} else {setTab("Schema")} }, [ schema ] )
    const Tab = (props) => { return <Menu.Item onClick={()=>{setTab(props.name)}} active={tab===props.name}  {...props} /> }
    return {
        tab,
        schemaName: schema,
        setTab,
        setSchema,
        refreshSchemas: refresh,
        schemas,
        NavigationJSX: ( <>
          <Menu pointing inverted className='cbr cbl'>
            <Image size='mini' src='/logoToolbar.png' className='ml-2' />
            <Menu.Item header className='pl-2' >CDAP Provisioner</Menu.Item>
            <Tab name='Dashboard' icon='dashboard' />
            <Tab name="Settings" icon='settings' />
            <Dropdown item loading={loadingSchemas} text={schema || "select schema"} >
              <Dropdown.Menu>
                { schemas.filter((s)=>s.name!==schema).map((schema) => {
                  return <Dropdown.Item key={schema.name} onClick={()=>{setSchema(schema.name);}} >{schema.name}</Dropdown.Item>
                }) }
                <Dropdown.Item icon='add' text='New' onClick={()=>{setTab("NewSchema");}}  />
              </Dropdown.Menu>
            </Dropdown>
            { schema &&
              <>
                <Tab name="Schema" icon='sliders' />
                <Tab name="Input" icon='disk' />
                <Tab name="Templates" icon='user' />
                <Tab name="Rules" icon='setting' />
                <Tab icon='close' onClick={()=>{setTab("Dashboard");setSchema(false);}} />
              </>
            }
          </Menu>
          {error&&<Container><Message error={true} header='Error' content={error} /></Container>}
          </>
    )}
}
