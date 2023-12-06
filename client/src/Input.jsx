import React, { useState } from 'react'
import { Container, Segment, Header, Message, Form, Button, Divider, Icon, Input, Menu, Select, Radio } from 'semantic-ui-react'
import { UseSchemaContext } from './contexts/SchemaContext'
import cronstrue from 'cronstrue';

import TemplatedField from './components/TemplatedField'

import useValidator from './hooks/useValidator'
import useFetch from './hooks/useFetch'

export default function Inputs( { schemaName } ) {
    const { schema, change, loading, save: saveSchema, saved, saving, refresh, invalid: i1, csv, loadingCSV } = UseSchemaContext();
    const { validate, valid, invalid: i2, validating } = useValidator();
    const invalid = { ...i1, ...i2 };
    const [ overrides, setOverrides ] = useState(schema.Overrides);
    const { fetch: saveOverrides } = useFetch({
        url: `/schema/${schemaName}/overrides`,
        method: 'POST',
        data: { overrides },
        finally: o => refresh(),
    });
    const { data: printers, loading: loadingPrinters } = useFetch({
        url: `/printers`,
        fetch: true,
        default: [
            { key: 'System Default', text: 'System Default', value: 'System Default' },
            { key: schema.printer, text: schema.printer, value: schema.printer }
        ],
        mutate: printers =>
        [...printers, {name: "System Default"}, {name: schema.printer} ]
        .filter((v, i, s) => i === s.findIndex((t) => (t.name === v.name)))
        .map(p=>({ key: p.name, text: p.name, value: p.name }))
    });
    const addOverride = (o={}) => setOverrides(overrides => ([...overrides, {key: "", value: "", ...o}]) )
    const changeOverride = (i, c) => setOverrides(overrides => overrides.map((o, k)=> i===k? ({...o, ...c }):o) )
    const removeOverride = i => setOverrides(overrides => overrides.filter((o, k)=> i!==k) )
    const copyOverride = i => addOverride( overrides[i] )
    const save = () => {
        saveSchema()
        saveOverrides()
    }

    const moveOverride = (i, d) => () => {
        setOverrides(o => {
            if (d && i <= 0) return o;
            if (!d && (i >= (o.length-1))) return o;
            const c = [...o];
            c[i] = c[d?i-1:i+1];
            c[d?i-1:i+1] = o[i];
            return c;
        })
    }

    const headers = (csv ? csv.meta.fields : []).map(h=>({ key: h, text: h, value: h }));
    //const printers = [...printerList, {name:"System Default"}].map(p=>({ key: p.name, text: p.name, value: p.name }));
    const cron = cronstrue.toString(schema.cron, { throwExceptionOnParseError: false });
    const invalidCron = cron.includes("An error occured when generating the expression description");
    return (
        <Container>
            <Segment loading={loading} >
                    <Header as='h2' content={`Input`} subheader={`Source CSV path and other input settings`} />
                    <Form onSubmit={e => { e.preventDefault(); }} onKeyPress={(e) => { e.key === 'Enter' && e.preventDefault(); }} >
                        <Header dividing as='h4'>CSV</Header>
                        <Form.Field>
                            <Form.Input label='CSV Source Path' required error={invalid.csv_path||schema.csv_path===""} >
                                <Input icon='hdd outline' iconPosition='left' placeholder='C:/input.csv'
                                className={`cbr ${valid.csv_path && "success"}`}
                                disabled={loading}
                                value={schema.csv_path}
                                onChange={e=> change({csv_path: e.target.value }) }
                                />
                                <Button className='cbl' primary content="Validate"
                                loading={validating.csv_path}
                                disabled={validating.csv_path}
                                onClick={()=>{
                                    validate({ name: "csv_path", url: "/test/csv", data: { csv_path: schema.csv_path } })
                                }}
                                />
                            </Form.Input>
                        </Form.Field>
                        <Segment>
                            <Menu borderless secondary >
                                <Menu.Item className='p-0'>
                                    <Header as='h4' className="text" content="Overrides" subheader="Override CSV keys or add arbitrary values for templates and rules" />
                                </Menu.Item>
                                <Menu.Menu position='right'>
                                    <Button icon={<Icon name="plus" />} as={Menu.Item} className='mr-2' onClick={()=>addOverride()}  />
                                </Menu.Menu>
                            </Menu>
                        </Segment>
                        {overrides.length<=0?<i>No overrides configured.</i>:
                        overrides.map((o, i)=>
                        <Form.Group widths='equal' key={i}>
                            <TemplatedField label="Key" placeholder='KEY' required
                            value={o.key} grid={{style:{width:'100%'}}}
                            onChange={e=> changeOverride(i, {key: e.target.value}) }
                            />
                            <div className='pr-1'></div>
                            <TemplatedField label="Value" placeholder='VALUE' required
                            value={o.value} grid={{style:{width:'100%'}}}
                            onChange={e=> changeOverride(i, {value: e.target.value}) }
                            />
                            <Form.Field width={1} control={Button} icon="close" color="red" label='Delete' className='mb-0 mt-2 p-0 pl-1' onClick={()=>removeOverride(i)} style={{height:"38px"}} />
                            <Form.Field width={1} control={Button} icon="copy" color="blue" label='Copy' className='mb-0 mt-2 p-0' onClick={()=>copyOverride(i)} style={{height:"38px"}} />
                            <Form.Field width={1}>
                                <Button.Group vertical size='tiny' className='mb-0 mt-2 p-0' >
                                    <Button icon="chevron up" onClick={moveOverride(i, true)}  disabled={i<=0} />
                                    <Button icon="chevron down" onClick={moveOverride(i, false)} disabled={i>=overrides.length-1} />
                                </Button.Group>
                            </Form.Field>
                        </Form.Group>
                        )}
                        <Header dividing as='h4'>LDAP</Header>
                        <Form.Field>
                            <Form.Field required control={Select} label='SAM Account Name - CSV Header' width={3}
                            error={invalid.csv_header||schema.csv_header===""} loading={loadingCSV}
                            options={headers} value={schema.csv_header} onChange={(e,d)=>change({csv_header: d.value})}
                            />
                            <div className='preview' >This CSV header will be used to find users by matching against directory SAM Account Names.</div>
                        </Form.Field>
                        <Form.Field>
                            <Form.Input label='Base Organizational Unit' placeholder='OU={{faculty}},OU=Child,OU=Parent' className='mb-0'
                            icon='folder outline' iconPosition='left'
                            value={schema.base_ou} onChange={e=> change({base_ou: e.target.value }) }
                            />
                            <div className='preview' >All LDAP paths (Organizational Units, Distinguished Names, Etc.) will be prepended by this path.</div>
                        </Form.Field>
                        <Header dividing as='h4'>eduSTAR Management Centre</Header>
                        <Form.Field control={Radio} toggle label='Enabled' className='mb-0'
                        checked={schema.use_edustar}
                        onClick={()=>change({use_edustar: !schema.use_edustar })}
                        /><div className='preview' >Download, match and merge user data from eduSTAR. eduSTAR user data will become available for templates.</div>
                        <Header dividing as='h4'>Automation</Header>
                        <Form.Field control={Radio} toggle label='Monitor CSV' className='mb-0'
                        checked={schema.csv_monitor}
                        onClick={()=>change({csv_monitor: !schema.csv_monitor })}
                        /><div className='preview' >Automaticly check schema when changes to the CSV file are detected.</div>
                        <Form.Field control={Radio} toggle label='CRON Schedule' className='mb-0'
                        checked={schema.use_cron}
                        onClick={()=>change({use_cron: !schema.use_cron })}
                        /><div className='preview' >Automaticly check schema on a CRON schedule.</div>
                        {schema.use_cron&&<>
                        <Form.Field>
                            <Form.Input label='CRON Expression' placeholder='0 * * * MON-FRI' className='mb-0'
                            icon='clock outline' iconPosition='left'
                            value={schema.cron} onChange={e=> change({cron: e.target.value }) }
                            />
                            <div className='preview' style={invalidCron?{color:"red"}:{}} >{invalidCron?cron:`Schema will be checked ${cron}.`}</div>
                        </Form.Field>
                        <Form.Field control={Radio} toggle label='Apply Directory Changes' className='mb-0'
                        checked={schema.autoexe}
                        onClick={()=>change({autoexe: !schema.autoexe })}
                        /><div className='preview' >After checking the schema, results will be processed and changes automaticly applied.<br/>
                        <b style={{color:'red'}}>Danger:</b> This can damage your directory. Confirm rules work as expected before enabling.
                        </div>
                        </>}<br/>
                        <Form.Field>
                            <Form.Field control={Select} label='Printer'
                            loading={loadingPrinters}
                            options={printers} value={schema.printer} onChange={(e,d)=>change({printer: d.value})}
                            />
                            <div className='preview' >PDF Print jobs will be sent to this printer target.</div>
                        </Form.Field>
                    </Form>
                    <Divider/>
                    {saved && <Message success={true} header='Success' content={"Changes saved."} />}
                    <Button primary loading={saving} disabled={loading||invalidCron} type="button" onClick={()=>save()}><Icon name="save" />Save</Button>
            </Segment>
        </Container>
    )
}
