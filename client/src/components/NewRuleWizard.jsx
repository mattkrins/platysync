import React, { useState, useEffect } from 'react'
import { Segment, Radio, Form, Divider, Select, Header } from 'semantic-ui-react'

import useFetch from '../hooks/useFetch'
import { UseSchemaContext } from '../contexts/SchemaContext'

import RadioDesc from './RadioDesc';
import Wizard from './Wizard'
import Conditions from './Conditions'
import TemplatedField from './TemplatedField'

import { commonAttributes } from '../modules/common.js'

const tabList = [
    "Rule Type",
    "Rule Conditions",
    "Settings",
    "Name",
]

export default function NewRuleWizard( { M, schemaName, close, rule } ) {
    const { schema } = UseSchemaContext();
    const [ conditions, setConditions ] = useState([]);
    const templates = (schema.Templates||[]).map(t=>({ key: t.id, text: t.name, value: t.id }));
    const noTemplates = templates.length <= 0;
    const [ options, setOptions ] = useState({
        type: false,
        enabled: false,
        enable_account: true,
        gen_pdf: false,
        print: false,
        edustar: false,
        TemplateId: '',
        name: '',
        description: '',
        ou: '',
        attribute: '',
    });
    const type = options.type;
    const edit = c => setOptions(o=>({...o, ...c}));
    useEffect(()=>{
        if (!rule) return;
        setOptions(rule);
        setConditions(rule.Conditions || []);
    }, [ rule ]);
    
    const { fetch: create, loading: creating } = useFetch({
        url: `/schema/${schemaName}/rules`,
        method: "post",
        data: {
            conditions,
            ...options,
            TemplateId: (!options.TemplateId || options.TemplateId.trim()==="") ? undefined : options.TemplateId,
            name: options.name.trim()==="" ? options.type : options.name
        },
        then: rule => close()
    });

    const finish = () => {
        if (rule) return create({method: "put",url: `/schema/${schemaName}/rules/${rule.id}`});
        create();
    }

    const createOperands = ["security", "attribute"];
    const noContinue = tab =>
    ( tab===0&&!type ) ||
    ( tab===1&&conditions.length<=0 ) ||
    ( tab===1&&(type==="create")&&conditions.filter(c=>createOperands.includes(c.operand)).length>=1 ) ||
    ( tab===2&&(type==="create")&&(!options.TemplateId || options.TemplateId.trim()==="") ) ||
    ( tab===2&&(type==="update")&&(!options.TemplateId || options.TemplateId.trim()==="") ) ||
    ( tab===2&&(type==="update")&&(options.edustar && options.attribute.trim()==="") ) ||
    ( tab===2&&(type==="move")&&(!options.ou || options.ou.trim()==="") )

    const operandFilter =
    ( ( type === "create" ) && (o => o.value === "input") )

    //const disallowedOperands = ( type === "create" ) ? ['security', 'attribute']
    //: [];
    //useEffect(()=>{ setConditions(conditions => conditions.filter(c=>!disallowedOperands.includes(c.operand))) }, [ type ])

    const setType = type => edit({type});
    const cleaned = [...commonAttributes, {key: options.attribute, text: options.attribute, value: options.attribute } ].filter((value, index, self) =>
        index === self.findIndex(t => t.key === value.key)
    )
    const tabs = [
        <Segment>
            <p>What type of rule would you like to create?</p>
            <RadioDesc name="create" label='New User' disabled={noTemplates}
            description={noTemplates?'You must create a template to use this feature.':'Creates a new user in the directory.'}
            icon={noTemplates?undefined:'add user'} color='blue' selected={type} selector={setType} />
            <RadioDesc name="enable" label='Enable User' description='Enables a user in the directory.' icon='unlock' color='green' selected={type} selector={setType} />
            <RadioDesc name="disable" label='Disable User' description='Disables a user in the directory.' icon='lock' color='grey' selected={type} selector={setType} />
            <RadioDesc name="update" label='Update User' disabled={noTemplates}
            description={noTemplates?'You must create a template to use this feature.':'Edit the attributes/security groups of a user in the directory.'}
            icon={noTemplates?undefined:'edit'} color='orange' selected={type} selector={setType} />
            <RadioDesc name="move" label='Move User' description='Moves a user from one directory OU to another.' icon='sign in alternate' color='purple' selected={type} selector={setType} />
            <RadioDesc name="delete" label='Delete User' description='Permanently removes a user from the directory.' icon='user delete' color='red' selected={type} selector={setType} />
        </Segment>,
        <Conditions header="Conditions" subheader="What conditions must be met for this rule to execute?"
        conditions={conditions} setConditions={setConditions} operandFilter={operandFilter}
        />,
        <Segment>
            <Header as='h4' content="Settings" subheader={"General settings for rule execution"} />
            <Form>
                <Form.Field control={Radio} toggle label='Rule Enabled' checked={options.enabled} onClick={()=>edit({enabled: !options.enabled})} />
                <Divider/>
                {(type==="create")&&
                <>
                <RadioDesc toggle label='Enable user account after creation' description="The user will be enabled in the directory. The password template field must be set for this to work."
                selected={options.enable_account} selector={()=>edit({enable_account: !options.enable_account})} />
                <Divider/>
                </>}
                {(type==="create"||type==="update")&&
                <>
                <Form.Field required control={Select} label='Attribute Template' width={3} placeholder="Template"
                options={templates} value={options.TemplateId} onChange={(e,d)=>edit({TemplateId: d.value})}
                />
                <Divider/>
                </>}
                {(type==="update"&&schema.use_edustar)&&
                <>
                <Header as='h5' className="mb-1">eduSTAR Management Centre</Header>
                <Form.Field className="mb-0" control={Radio} toggle label='Enable password writeback' checked={options.edustar} onClick={()=>edit({edustar: !options.edustar})} />
                <div className='preview' >Set eduSTAR user passwords to the chosen directory attribute (prior to encryption).</div>
                {options.edustar&&<Form.Field required search allowAdditions control={Select} label='Directory Attribute' width={3} placeholder="AD Attribute"
                options={cleaned} value={options.attribute} onChange={(e,d)=>edit({attribute: d.value})}
                />}
                <Divider/>
                </>}
                {type==="move"&&<><Form.Group widths='equal' className='pl-2 pb-2' >
                <TemplatedField label="Move To Organizational Unit" placeholder='OU={{faculty}},OU=Child,OU=Parent' required
                value={options.ou} grid={{style:{width:'80%'}}}
                onChange={e=> edit({ou: e.target.value}) }
                />
                </Form.Group>
                <Divider/></>}
                <RadioDesc toggle label='Generate a .pdf file' description="Generates and saves a templated .pdf file based on the path template field"
                selected={options.gen_pdf} selector={()=>edit({gen_pdf: !options.gen_pdf})} />
                <RadioDesc name="print" toggle label='Print' description='Sends the generated .pdf file to the print queue (if printing on schema is enabled)'
                selected={options.print} selector={()=>edit({print: !options.print})} />
            </Form>
        </Segment>,
        <Segment>
            <Form>
                <Form.Group widths='equal'>
                    <Form.Input fluid label='Rule Name' placeholder={type} value={options.name} onChange={e=> edit({name: e.target.value}) } />
                </Form.Group>
                <Form.Group widths='equal'>
                    <Form.TextArea label='Description' placeholder='Describe what this rule does...'
                    value={options.description} onChange={e=> edit({description: e.target.value}) }
                    />
                </Form.Group>
            </Form>
        </Segment>
    ]

    return (
        <Wizard M={M} name={rule?"Edit Rule":"New Rule Wizard"} close={close} noContinue={noContinue} finishing={creating} finish={finish}
        tabList={tabList} tabs={tabs} finishText={rule?"Update Rule":"Create Rule"} allowNavigation={!!rule}
        />
    )
}
