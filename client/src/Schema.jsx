import React, { useRef } from 'react'
import { Container, Segment, Header, Message, Form, Button, Divider, Icon, Input } from 'semantic-ui-react'

import { UseSchemaContext } from './contexts/SchemaContext'
import { useConfirmer } from './contexts/ConfirmContext'

import useFetch from './hooks/useFetch'
import useValidator from './hooks/useValidator'

export default function Schema( { schemaName, setSchema, refreshSchemas } ) {
    const { confirm }  = useConfirmer();
    const inputFile = useRef(null);
    const { schema, change, loading, save: saveSchema, saved, saving, refresh, invalid: i1 } = UseSchemaContext();
    const { validate, valid, invalid: i3, validating } = useValidator();
    const save = () => {
        saveSchema()
        if (schemaName!==schema.name) setSchema(schema.name);
    }
    const { fetch: del, loading: deleting, invalid: i2 } = useFetch({
        url: `/schema/${schemaName}`,
        method: "delete",
        then: () => { setSchema(false); refreshSchemas(); }
    });
    const { fetch: upload, loading: uploading } = useFetch({
        url: `/schema/${schemaName}/import`,
        method: "post",
        headers: { 'Content-Type': 'multipart/form-data' },
        finally: () => { refreshSchemas(); refresh(); }
    });

    const uploader = event => {
        event.stopPropagation();
        event.preventDefault();
        const file = event.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        upload({data: formData});
        inputFile.current.value = "";
    }

    const invalid = { ...i1, ...i2, ...i3 };
    return (
        <Container>
            <input type='file' ref={inputFile} style={{display: 'none'}} onChange={uploader}  />
            <Segment loading={loading} >
                <Header as='h2' content={`Schema`} subheader={`General config for the '${schema.name}' schema`} />
                <Form onSubmit={e => { e.preventDefault(); }} onKeyPress={(e) => { e.key === 'Enter' && e.preventDefault(); }} >
                    <Form.Field>
                        <Form.Input label='Name' placeholder='My Schema Name'  error={invalid.name} >
                            <Input icon='tag' iconPosition='left' placeholder='ldaps://10.10.1.1:636'
                            disabled={loading}
                            value={schema.name}
                            onChange={e=> change({name: e.target.value}) }
                            />
                        </Form.Input>
                    </Form.Field>
                    <Header dividing as='h4'>LDAP</Header>
                    <Form.Field >
                        <Form.Input label='Target URI' required error={invalid.ldap_uri} >
                            <Input icon='group' iconPosition='left' placeholder='ldaps://10.10.1.1:636'
                            className={`cbr ${valid.ldap_uri && "success"}`}
                            disabled={loading}
                            value={schema.ldap_uri}
                            onChange={e=> change({ldap_uri: e.target.value }) }
                            />
                            <Button className='cbl' primary content="Connect"
                            loading={validating.ldap_uri}
                            disabled={validating.ldap_uri}
                            onClick={()=>{
                                validate({ name: "ldap_uri", url: "/test/ldap", data: { ldap_uri: schema.ldap_uri } })
                            }}
                            />
                        </Form.Input>
                    </Form.Field>
                    <Form.Field>
                        <Form.Input label='Credentials' required error={invalid.credentials} >
                            <Input icon='user' iconPosition='left' placeholder='domain\username | username@domain.com | DN'
                            className={`cbr ${valid.credentials && "success"}`}
                            disabled={loading}
                            value={schema.ldap_user}
                            onChange={e=> change({ldap_user: e.target.value }) }
                            />
                            <Input icon='key' iconPosition='left' placeholder='password' type='password'
                            className={`cbl cbr ${valid.credentials && "success"}`}
                            disabled={loading}
                            value={schema.ldap_pass}
                            onChange={e=> change({ldap_pass: e.target.value }) }
                            />
                            <Button className='cbl' primary content="Login"
                            loading={validating.credentials}
                            disabled={validating.credentials}
                            onClick={()=>{
                                validate({
                                    name: "credentials",
                                    url: "/test/login",
                                    data: schema
                                })
                            }}
                            />
                        </Form.Input>
                    </Form.Field>
                </Form>
                {saved && <Message success={true} header='Success' content={"Changes saved."} />}
                <Divider/>
                <Button primary loading={saving} disabled={loading||deleting} type="button" onClick={()=>save()}><Icon name="save" />Save</Button>
                <Button secondary loading={saving} disabled={loading||deleting} type="button" onClick={()=>refresh()}><Icon name="repeat" />Reset</Button>
                <Button loading={deleting} disabled={loading||deleting} color='red' type="button" onClick={()=>confirm({
                    icon: "trash alternate",
                    title: `Delete '${schemaName}' schema?`,
                    content: `This will delete the entire '${schema.name||""}' schema. This action can not be undone and will result in permanent data loss.`,
                    then: ()=> del()
                })}><Icon name="trash alternate" />Delete Schema</Button>
                <Button as="a" download href={`http://localhost:7870/api/schema/${schemaName}/export`} ><Icon name="download" />Export</Button>
                <Button onClick={()=>inputFile.current.click()} ><Icon name="upload" loading={uploading} />Import</Button>
            </Segment>
        </Container>
    )
}