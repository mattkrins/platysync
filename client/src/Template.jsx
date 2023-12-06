import React from 'react'
import { Form, Button, Divider, Icon, Menu, Header, Checkbox, Segment, Label } from 'semantic-ui-react'

import SimpleField from './components/SimpleField'
import TemplatedField from './components/TemplatedField'

import { commonAttributes } from './modules/common.js'

export default function Template( { template, change, loading, saving, save, attributes, setAttributes, groups, setGroups } ) {

    const addAttribute = (o={}) => setAttributes(attributes => ([...attributes, {key: "", value: "", encrypt: false, password: "", ...o}]) )
    const changeAttribute = (i, c) => setAttributes(attributes => attributes.map((o, k)=> i===k? ({...o, ...c }):o) )
    const removeAttribute = i => setAttributes(attributes => attributes.filter((o, k)=> i!==k) )
    const copyAttribute = i => addAttribute( attributes[i] )

    const addGroup = (o={}) => setGroups(groups => ([...groups, {key: "", value: "", ...o}]) )
    const changeGroup = (i, c) => setGroups(groups => groups.map((o, k)=> i===k? ({...o, ...c }):o) )
    const removeGroup = i => setGroups(groups => groups.filter((o, k)=> i!==k) )
    const copyGroup = i => addGroup( groups[i] )


    const userPrincipalNameValid = p => /^([a-z0-9]+(?:[._-][a-z0-9]+)*)@([a-z0-9]+(?:[.-][a-z0-9]+)*\.[a-z]{2,})$/i.test( p ) ? false : "Invalid userPrincipalName";
    const sAMAccountNameTestValid = p => /^([a-zA-Z0-9-+]{5,})$/.test( p ) ? 0 : "Invalid sAMAccountName";
    
    return (
        <>
                <Form onSubmit={e => { e.preventDefault(); }} onKeyPress={(e) => { e.key === 'Enter' && e.preventDefault(); }} >
                    <SimpleField label="Template Name" placeholder='{{name}}' required
                    value={template.name}
                    onChange={e=> change({name: e.target.value }) }
                    />
                    <TemplatedField label="Canonical Name" placeholder='{{name}}'
                    value={template.cn}
                    onChange={e=> change({cn: e.target.value }) }
                    />
                    <TemplatedField label="SAM Account Name" placeholder='{{username}}'
                    value={template.sam}
                    previewValidator={sAMAccountNameTestValid}
                    onChange={e=> change({sam: e.target.value }) }
                    />
                    <TemplatedField label="User Principal Name" placeholder='{{username}}@domain.com'
                    value={template.upn}
                    previewValidator={userPrincipalNameValid}
                    onChange={e=> change({upn: e.target.value }) }
                    />
                    <TemplatedField label="Organizational Unit" placeholder='OU={{faculty}},OU=Child,OU=Parent'
                    value={template.ou}
                    onChange={e=> change({ou: e.target.value }) }
                    />
                    <TemplatedField label="Password" placeholder='{{word}}{{rand 1 9}}{{cap (word)}}{{special}}'
                    value={template.pass} grid={{style:{paddingBottom:'10px'}}}
                    onChange={e=> change({pass: e.target.value }) }
                    />
                    <Divider />
                    <Menu borderless secondary >
                        <Menu.Item className='p-0'>
                            <Header as='h4' className="text" content="Attributes" subheader="Set the attribute values of a directory object" />
                        </Menu.Item>
                        <Menu.Menu position='right'>
                            <Button icon={<Icon name="plus" />} as={Menu.Item} className='mr-2' onClick={()=>addAttribute()}  />
                        </Menu.Menu>
                    </Menu>
                    <Segment basic className='p-0 pl-2' >
                    {attributes.length<=0?<i>No attributes to set.</i>:
                    attributes.map((o, i)=> {
                        const cleaned = [...commonAttributes, {key: o.key, text: o.key, value: o.key } ].filter((value, index, self) =>
                            index === self.findIndex(t => t.key === value.key)
                        )
                        return <Form.Group widths='equal' key={i}>
                        <Form.Field width={2} control={Label} label='Overwrite' className='mb-0 mt-2 p-0 pl-0 pr-2' style={{height:"38px",width:'100%'}}
                        content={
                            <Checkbox toggle checked={o.overwrite || false} onClick={e=> changeAttribute(i, {overwrite: !o.overwrite}) } 
                            style={{paddingTop:"3px", paddingLeft: "5px"}}
                            />
                        }
                        />
                        <Form.Select fluid label='Attribute' placeholder='Attribute Name' className='mb-0 mt-2 p-0 pr-1' required
                        search allowAdditions options={cleaned} value={o.key} width={6}
                        onChange={(e, { value })=> changeAttribute(i, {key: value}) }
                        />
                        <div className='pr-1'></div>
                        <TemplatedField label="Value" placeholder='VALUE'
                        value={o.value} grid={{style:{width:'100%'}}}
                        onChange={e=> changeAttribute(i, {value: e.target.value}) }
                        />
                        {o.encrypt&&<><div className='pr-1'></div>
                        <TemplatedField label="Encryption Key" placeholder='Password' required
                        value={o.password} grid={{style:{width:'60%'}}}
                        onChange={e=> changeAttribute(i, {password: e.target.value}) }
                        /></>}
                        <Form.Field width={2} control={Label} label='Encrypt' className='mb-0 mt-2 p-0 pl-0 pr-1' style={{height:"38px",width:'100%'}}
                        content={
                            <Checkbox toggle checked={o.encrypt || false} onClick={e=> changeAttribute(i, {encrypt: !o.encrypt}) } 
                            style={{paddingTop:"3px", paddingLeft: "5px"}}
                            />
                        }
                        />
                        <Form.Field width={1} control={Button} icon="close" color="red" label='Delete' className='mb-0 mt-2 p-0 pl-1' onClick={()=>removeAttribute(i)} style={{height:"38px"}} />
                        <Form.Field width={1} control={Button} icon="copy" color="blue" label='Copy' className='mb-0 mt-2 p-0' onClick={()=>copyAttribute(i)} style={{height:"38px"}} />
                    </Form.Group>})}
                    </Segment>
                    <Menu borderless secondary >
                        <Menu.Item className='p-0'>
                            <Header as='h4' className="text" content="Security Groups" subheader="Add directory objects to security groups" />
                        </Menu.Item>
                        <Menu.Menu position='right'>
                            <Button icon={<Icon name="plus" />} as={Menu.Item} className='mr-2' onClick={()=>addGroup()}  />
                        </Menu.Menu>
                    </Menu>
                    <Segment basic className='p-0 pl-2' >
                    {groups.length<=0?<i>No groups to add.</i>:
                    groups.map((o, i)=>
                    <Form.Group widths='equal' key={i}>
                        <TemplatedField label="Distinguished Name" placeholder='CN={{faculty}},OU={{faculty}},OU=Child,OU=Parent' required
                        value={o.value} grid={{style:{width:'100%'}}}
                        onChange={e=> changeGroup(i, {value: e.target.value}) }
                        />
                        <div className="one wide field mb-0 mt-2 p-0 pl-1" style={{width: '4.25%!important'}} onClick={()=>removeGroup(i)} >
                            <label>Delete</label>
                            <button className="ui red icon button" style={{height:"38px"}}><i aria-hidden="true" className="close icon"></i></button>
                        </div>
                        <Form.Field width={1} control={Button} icon="copy" color="blue" label='Copy' className='mb-0 mt-2 p-0' onClick={()=>copyGroup(i)} style={{height:"38px"}} />
                    </Form.Group>)}
                    </Segment>
                    <Form.Field label='Remove security groups not listed here' control={Checkbox} toggle 
                    checked={template.remove_groups || false}
                    onChange={e=> change({remove_groups: !(template.remove_groups || false) }) }
                    className="pt-2"
                    />
                    <Divider />
                    <TemplatedField label="Source .pdf file input template path" placeholder='D:/templates/input/{{faculty}}.pdf' icon="file pdf"
                    value={template.pdf_source} grid={{style:{paddingBottom:'0px'}}}
                    onChange={e=> change({pdf_source: e.target.value }) }
                    />
                    <TemplatedField label="Target .pdf save output path" placeholder='D:/output/output/{{username}}.pdf' icon="file alternate outline"
                    value={template.pdf_target} grid={{style:{paddingBottom:'10px'}}}
                    onChange={e=> change({pdf_target: e.target.value }) }
                    />
                    
                    
                </Form>
                <Divider/>
                <Button primary loading={saving} disabled={loading} type="button" onClick={()=>save()}><Icon name="save" />Save</Button>
        </>
    )
}
