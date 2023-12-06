import React from 'react'
import { Container, Segment, Header, Menu, Button, Label, Card, Checkbox, Grid, Icon, Popup } from 'semantic-ui-react'

import useModal from './hooks/useModal'
import useFetch from './hooks/useFetch'

import { useConfirmer } from './contexts/ConfirmContext'
import { UseSchemaContext } from './contexts/SchemaContext'

import NewRuleWizard from './components/NewRuleWizard'

const colors = { create: "blue", enable: "green", disable: "grey", update: "orange", move: "purple", delete: "red" }

export default function Rules( { schemaName } ) {
    const { confirm }  = useConfirmer();
    const { Modal, open, close } = useModal({name:"New Rule Wizard"});
    const { schema, refresh, loading: fetchingRules, change } = UseSchemaContext();

    const { data: rule, fetch: fetchRule, loading: fetchingRule, reset: clearRule } = useFetch({
        then: () => open()
    });
    const { fetch: remove, loading: removing } = useFetch({ method: "delete", then: ()=> refresh() });
    const { fetch: toggle, request: toggling } = useFetch({ method: "put", then: ()=> refresh(), cleanup: true });
    const { fetch: copy, loading: copying } = useFetch({ method: "put", then: ()=> refresh() });

    const closer = () => {
        refresh();
        clearRule();
        close();
    }

    const { fetch: move2, loading: moving } = useFetch({ method: "put", then: ()=> refresh() });
    const move = (i, r, d) => () => {
        const o = [...schema.Rules];
        if (d && i <= 0) return;
        if (!d && (i >= (o.length-1))) return;
        const c = [...o];
        c[i] = c[d?i-1:i+1];
        c[i].index = i;
        c[d?i-1:i+1] = o[i];
        c[d?i-1:i+1].index = d?i-1:i+1;
        change({Rules: c})
        move2({
            url: `/schema/${schemaName}/rules/move`,
            data: c.map(({id, index})=>({id, index})),
            id: r.id
        })

    }

    return (
        <Container>
            <NewRuleWizard M={Modal} schemaName={schemaName} close={closer} rule={rule} closing={removing} />
            <Segment loading={fetchingRules||fetchingRule||removing} >
                <Menu borderless secondary >
                    <Menu.Item className='p-0'>
                        <Header as='h2' content={`Rules`} subheader={`Add rules to control the flow of execution logic`} />
                    </Menu.Item>
                    <Menu.Menu position='right'>
                        <Button icon="plus" as={Menu.Item} className='mr-2' onClick={()=>open()}  />
                    </Menu.Menu>
                </Menu>
                {schema.Rules.length<=0?<i>No rules have been defined.</i>:
                schema.Rules.map((r, i)=>
                <Grid className='mb-1 mt-1' key={r.id} >
                    <Grid.Column width={15} className='pr-0 pb-0 pt-1'>
                        <Card fluid color={colors[r.type]} >
                            <Card.Content>
                                <Button basic floated='right' color='blue' disabled={toggling&&toggling.id===r.id} content={
                                    <Checkbox toggle checked={toggling&&toggling.id===r.id?!r.enabled:r.enabled}
                                    onClick={()=>toggle({url: `/schema/${schemaName}/rules/${r.id}/toggle`,id:r.id})} />
                                } style={{padding:"8px 7px 5px 5px"}}
                                />
                                <Button icon="close" floated='right' color='red'
                                onClick={()=>confirm({
                                    icon: "close",
                                    title: `Delete '${r.type}' rule?`,
                                    then: ()=>remove({url: `/schema/${schemaName}/rules/${r.id}`})
                                })}
                                />
                                <Button icon="edit" floated='right' color='black'
                                onClick={()=>fetchRule({url: `/schema/${schemaName}/rules/${r.id}`})}
                                />
                                <Button icon="copy outline" floated='right' color='blue' loading={copying}
                                onClick={()=>copy({url: `/schema/${schemaName}/rules/${r.id}/copy`})}
                                />
                                <Card.Header>{r.name} <Label circular color={r.enabled?"green":"red"} empty />
                                {r.gen_pdf&&<Icon name="file pdf" size='small' />}
                                {r.print&&<Icon name="print" size='small' />}
                                {r.edustar&&<Icon name="cloud upload" size='small' />}
                                </Card.Header>
                                <Card.Meta>{r.enabled?"Enabled":"Disabled"} | {r.Conditions.length} Conditions{r.description.trim()===""?'':` | ${r.description}`}</Card.Meta>
                            </Card.Content>
                        </Card>
                    </Grid.Column>
                    <Grid.Column width={1} className='pb-0'>
                        <Button.Group basic vertical size='tiny' floated='right' style={{height:"100%"}} >
                            <Button icon="chevron up" onClick={move(i, r, true)} disabled={i<=0||moving} />
                            <Button icon="chevron down" onClick={move(i, r, false)} disabled={i>=schema.Rules.length-1||moving} />
                        </Button.Group>
                    </Grid.Column>
                </Grid>
                )}
            </Segment>
        </Container>
    )
}
