import React, { useRef } from 'react'
import { Container, Segment, Header, Message, Form, Button, Divider, Icon, Input } from 'semantic-ui-react'

import { UseAppContext } from './contexts/AppContext'

import useValidator from './hooks/useValidator'
import useFetch from './hooks/useFetch'

export default function Settings( { schemaName, setSchema, refreshSchemas } ) {
    const inputFile = useRef(null);
    const { app, change, loading, save: saveSettings, saved, saving, refresh, invalid: i1 } = UseAppContext();
    const { validate, valid, invalid: i3, validating } = useValidator();
    const save = () => saveSettings().finally(()=>refresh())
    
    const { fetch: upload, loading: uploading } = useFetch({
        url: `/import`,
        method: "post",
        headers: { 'Content-Type': 'multipart/form-data' },
        finally: () => { refresh(); }
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

    const invalid = { ...i1, ...i3 };
    return (
        <Container>
            <input type='file' ref={inputFile} style={{display: 'none'}} onChange={uploader}  />
            <Segment loading={loading} >
                <Header as='h2' content={`Settings`} subheader={`General application settings`} />
                <Form onSubmit={e => { e.preventDefault(); }} onKeyPress={(e) => { e.key === 'Enter' && e.preventDefault(); }} >
                    <Form.Field >
                        <Form.Input label='HTTP/S Proxy' error={invalid.proxy} className='mb-0' >
                            <Input icon='group' iconPosition='left' placeholder='http://eduproxy:8080'
                            className={`cbr ${valid.proxy && "success"}`}
                            disabled={loading}
                            value={app.proxy}
                            onChange={e=> change({proxy: e.target.value }) }
                            />
                            <Button className='cbl' primary content="Connect"
                            loading={validating.proxy}
                            disabled={validating.proxy}
                            onClick={()=>{
                                validate({ name: "proxy", url: "/test/proxy", data: { proxy: app.proxy } })
                            }}
                            />
                        </Form.Input>
                        <div className='preview' >Blank if not accessing eduSTAR & blank for no proxy.</div>
                    </Form.Field>
                    <Header dividing as='h4'>eduSTAR Management Centre</Header>
                    <Form.Field>
                        <Form.Input label='Credentials' error={invalid.credentials} >
                            <Input icon='user' iconPosition='left' placeholder='ST01234'
                            className={`cbr ${valid.credentials && "success"}`}
                            disabled={loading}
                            value={app.edustar_user||""}
                            onChange={e=> change({edustar_user: e.target.value }) }
                            />
                            <Input icon='key' iconPosition='left' placeholder='password' type='password'
                            className={`cbl cbr ${valid.credentials && "success"}`}
                            disabled={loading}
                            value={app.edustar_pass||""}
                            onChange={e=> change({edustar_pass: e.target.value }) }
                            />
                            <Button className='cbl' primary content="Login"
                            loading={validating.credentials}
                            disabled={validating.credentials}
                            onClick={()=>{
                                validate({
                                    name: "credentials",
                                    url: "/test/edustar",
                                    data: app
                                })
                            }}
                            />
                        </Form.Input>
                    </Form.Field>
                    <Form.Field>
                        <Form.Input label='School ID/Number' >
                            <Input icon='group' iconPosition='left' placeholder='8827' type="number"
                            disabled={loading}
                            value={app.school_id}
                            onChange={e=> change({school_id: e.target.value }) }
                            />
                        </Form.Input>
                    </Form.Field>
                    <Form.Field>
                        <Form.Input label='Caching Policy' className='mb-0' >
                            <Input icon='clock outline' iconPosition='left' placeholder='24' type="number"
                            disabled={loading}
                            value={app.cache_policy}
                            onChange={e=> change({cache_policy: e.target.value }) }
                            />
                        </Form.Input>
                        <div className='preview' >Hours until cached eduSTAR data is refreshed.</div>
                    </Form.Field>
                </Form>
                {saved && <Message success={true} header='Success' content={"Changes saved."} />}
                <Divider/>
                <Button primary loading={saving} disabled={loading} type="button" onClick={()=>save()}><Icon name="save" />Save</Button>
                <Button as="a" download href={`http://localhost:7870/api/export`} ><Icon name="download" />Export</Button>
                <Button onClick={()=>inputFile.current.click()} ><Icon name="upload" loading={uploading} />Import</Button>
            </Segment>
        </Container>
    )
}