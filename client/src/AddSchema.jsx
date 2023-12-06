import React, { useState } from 'react'
import { Container, Segment, Header, Button, Form } from 'semantic-ui-react'

import useFetch from './hooks/useFetch'

export default function AddSchema( { refreshSchemas, setSchema, setTab } ) {
    const [ name, setName ] = useState("");
    const { fetch, loading, invalid } = useFetch({
        url: "/schema",
        method: "post",
        data: { name },
        then: ( schema ) => {
            refreshSchemas().then(()=>{
                setSchema(schema.name);
                setTab("Schema");
            })
        }
    });
    return (
        <Container>
            <Segment className='mb-0 cbb'>
                    <Header as='h2'>Add Schema</Header>
                    <Form >
                        <Form.Field>
                            <Form.Input label='Schema Name' placeholder='My Schema Name' 
                            //error={errors && (String(errors[0].message))}
                            error={invalid.name}
                            disabled={loading}
                            value={name}
                            onKeyDown={e => e.key === 'Enter' && fetch() }
                            onChange={e=> setName(e.target.value) }
                            />
                        </Form.Field>
                    </Form>
            </Segment>
            <Button disabled={name.trim()===""} attached="bottom" primary onClick={()=>{fetch()}} loading={loading} >Create Schema</Button>
        </Container>
    )
}
