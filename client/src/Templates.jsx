import React, { useEffect, useState } from 'react'
import { Container, Segment, Header, Menu, Button, Card } from 'semantic-ui-react'

import { useConfirmer } from './contexts/ConfirmContext'
import { UseSchemaContext } from './contexts/SchemaContext'

import useFetch from './hooks/useFetch'

import Template from './Template'

export default function Templates( { schemaName } ) {
    const { confirm }  = useConfirmer();
    const [ editing, setEditing ] = useState(false);
    const { schema, refresh: fetchAll, loading: fetchingAll } = UseSchemaContext();

    const { data: removed, fetch: remove, loading: removing } = useFetch({ method: "delete" });
    
    const { data: added, fetch: add, loading: adding } = useFetch({
        url: "/template",
        method: "post",
        data: { schemaName },
        then: template => setEditing(template)
    });

    const { data: template, setData: setTemplate, fetch, loading: fetching } = useFetch({
        url: `/template/${editing.id}`,
        default: { name: "loading...", cn: "", sam: "", upn: "", ou: "", pass: "", Attributes: [], Groups: [], pdf: "" }
    });
    const [ attributes, setAttributes ] = useState(template.Attributes);
    const [ groups, setGroups ] = useState(template.Groups);
    useEffect(()=>{ setAttributes(template.Attributes) }, [ template.Attributes ])
    useEffect(()=>{ setGroups(template.Groups) }, [ template.Groups ])
    const { data: saved, fetch: save, loading: saving } = useFetch({
        url: `/template/${editing.id}`,
        method: "put",
        data: { template, attributes, groups },
        then: () => setEditing(false)
    });
    const change = changes => setTemplate(data=>({...data, ...changes}));
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(()=>{ if (editing) fetch() }, [ editing ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(()=>{ if (added||removed||saved) fetchAll() }, [ added, removed, saved ])
    const loading = fetchingAll||adding||removing;
    return (
        <Container>
            <Segment loading={loading}>
                <Menu borderless secondary >
                    <Menu.Item className='p-0'>
                        <Header as='h2' className="text" content="Templates" subheader="Build object state templates" />
                    </Menu.Item>
                    <Menu.Menu position='right'>
                        <Button icon="plus" as={Menu.Item} className='mr-2' onClick={()=>add()}  />
                    </Menu.Menu>
                </Menu>
                {!editing?<>
                {schema.Templates.length<=0?<i>No templates configured. Create a new template to start.</i>:
                schema.Templates.map(t=>
                <Card key={t.id} fluid color='red'>
                    <Card.Content>
                        <Button icon="close" floated='right' color='red'
                        onClick={()=>confirm({
                            icon: "remove user",
                            title: `Delete template '${t.name}'`,
                            then: ()=>remove({url:`/template/${t.id}`})
                        })}
                        />
                        <Button icon="edit" floated='right' color='black'
                        onClick={()=>setEditing(t)}
                        />
                        <Card.Header>{t.name}</Card.Header>
                        <Card.Meta>{t.Attributes.length} Directory Attributes | {t.Groups.length} Security Groups</Card.Meta>
                    </Card.Content>
                </Card>
                )}
                </>
                :<Segment color='red' loading={fetching} >
                    <Menu borderless secondary >
                        <Menu.Item className='p-0'>
                            <Header as='h3' className="text" content={editing.name} subheader={editing.id} />
                        </Menu.Item>
                        <Menu.Menu position='right'>
                            <Button icon="close" as={Menu.Item} className='mr-2' onClick={()=>setEditing(false)}  />
                        </Menu.Menu>
                    </Menu>
                    <Template template={template} change={change} loading={loading} saving={saving} save={save}
                    attributes={attributes} setAttributes={setAttributes} groups={groups} setGroups={setGroups}
                    />
                </Segment>}
            </Segment>
        </Container>
    )
}
