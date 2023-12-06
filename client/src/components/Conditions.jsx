import React from 'react'
import { Segment, Menu, Header, Button, Form, Icon, Select } from 'semantic-ui-react'

import { commonAttributes } from '../modules/common.js'

import TemplatedField from './TemplatedField'

const operands = [
    { key: 'input', text: 'Input', value: 'input' },
    { key: 'security', text: 'Security Groups', value: 'security' },
    { key: 'attribute', text: 'Directory Attribute', value: 'attribute' },
]

const operators = [
    { key: '==', text: 'Equal To', value: '==' },
    { key: '!=', text: 'Not Equal To', value: '!=' },
    { key: 'contains', text: 'Contains', value: 'contains' },
    { key: 'missing', text: 'Does not Contain', value: 'missing' },
    { key: 'starts', text: 'Starts With', value: 'starts' },
    { key: 'ends', text: 'Ends With', value: 'ends' },
]

export default function Conditions( { header, subheader, conditions, setConditions, operandFilter } ) {

    const addCondition = (c) => {
        setConditions(data=>[...data, {key: 'key', value: 'value', operator: "==", operand: "input", ...c}]);
    }
    const changeCondition = (index,key,value) => {
        setConditions(data=>data.map((o,i)=>i===index?{...o, [key]: value}:o));
    }
    const removeCondition = (index) => {
        setConditions(data=>data.filter((o,i)=>i!==index));
    }
    const copyCondition = (index) => {
        addCondition(conditions[index]);
    }

    const moveCondition = (i, d) => () => {
        setConditions(o => {
            if (d && i <= 0) return o;
            if (!d && (i >= (o.length-1))) return o;
            const c = [...o];
            c[i] = c[d?i-1:i+1];
            c[d?i-1:i+1] = o[i];
            return c;
        })
    }

    return (
        <Segment>
            <Menu borderless secondary >
                <Menu.Item className='p-0'>
                    <Header as='h4' className="text" content={header} subheader={subheader} />
                </Menu.Item>
                <Menu.Menu position='right'>
                    <Button icon={<Icon name="plus" />} as={Menu.Item} className='mr-2' onClick={()=>addCondition()}  />
                </Menu.Menu>
            </Menu>
            <Form>
                {conditions.length<=0?<i>No conditions have been defined.</i>:
                conditions.map((o,i)=> {
                    const cleaned = [...commonAttributes, {key: o.key, text: o.key, value: o.key } ].filter((value, index, self) =>
                        index === self.findIndex(t => t.key === value.key)
                    )
                    return <Form.Group widths='equal' key={i}>
                    <Form.Field required
                        width={4}
                        control={Select}
                        label='Operand'
                        options={operandFilter?operands.filter(operandFilter):operands}
                        className='mb-0 mt-2'
                        value={o.operand}
                        onChange={(e,d)=>{
                            changeCondition(i, 'operand', d.value);
                            if (d.value==="security") changeCondition(i, 'operator', "contains")
                        }}
                        placeholder='Input'
                    />
                    {(o.operand!=="security"&&o.operand!=="attribute")&&
                    <TemplatedField label="Key" placeholder='KEY' required
                    value={o.key} grid={{style:{width:'100%'}}}
                    onChange={e=> changeCondition(i, 'key', e.target.value) }
                    />}
                    {o.operand==="attribute"&&<Form.Select fluid label='Attribute' placeholder='Attribute Name' className='mb-0 mt-2 p-0 pr-1' required
                    search allowAdditions options={cleaned} value={o.key} width={6}
                    onChange={(e, { value })=> changeCondition(i, 'key', value) }
                    />}
                    <Form.Field required
                        width={4}
                        control={Select}
                        label='Operator'
                        options={o.operand==="security"?operators.filter(o=>["contains","missing"].includes(o.value)):operators}
                        className='mb-0 mt-2'
                        value={o.operator}
                        onChange={(e,d)=>changeCondition(i, 'operator', d.value)}
                        placeholder='=='
                    />
                    <TemplatedField label="Value" placeholder='VALUE'
                    value={o.value} grid={{style:{width:'100%'}}}
                    onChange={e=> changeCondition(i, 'value', e.target.value) }
                    delimiter={o.delimiter}
                    setDelimiter={e=> changeCondition(i, 'delimiter', e) }
                    />
                    <Form.Field width={1} control={Button} icon="copy" color="blue" label='Copy' className='mb-0 mt-2 pr-0' onClick={()=>copyCondition(i)} style={{height:"38px"}} />
                    <Form.Field width={1} control={Button} icon="close" color="red" label='Delete' className='mb-0 mt-2 p-0' onClick={()=>removeCondition(i)} style={{height:"38px"}} />
                    <Form.Field width={1}>
                        <Button.Group vertical size='tiny' className='mb-0 mt-2 p-0' >
                            <Button icon="chevron up" onClick={moveCondition(i, true)}  disabled={i<=0} />
                            <Button icon="chevron down" onClick={moveCondition(i, false)} disabled={i>=conditions.length-1} />
                        </Button.Group>
                    </Form.Field>
                </Form.Group>}
                )}
            </Form>
        </Segment>
    )
}
