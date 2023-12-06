import React, { useState } from 'react'
import { Input, Button, Dropdown } from 'semantic-ui-react'

import { UseSchemaContext } from '../contexts/SchemaContext'

export default function CSVSelector( { onSelection, ...props } ) {
    const { csv, csvRow } = UseSchemaContext();
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState("");
    const filtered = (csv ? csv.meta.fields : []).filter(value => {
        return value.toLowerCase().includes(filter.toLowerCase());
    });
    return (
        <Dropdown compact as={Button} {...props}
        button icon='search' className='icon ml-1' 
        open={isOpen} onClick={()=>setIsOpen(true)} onClose={()=>setIsOpen(false)}
        closeOnBlur={false}
        >
        { isOpen ?
        <Dropdown.Menu  open={isOpen} style={{maxWidth:"200px"}} >
            <Input icon='search' iconPosition='left' className='search' style={{width:"92%"}}
            onClick={e => e.stopPropagation()}
            onChange={e=>{ setFilter(e.target.value); }}
            autoFocus
            />
            <Dropdown.Menu scrolling>
            { filtered.map((header, index)=>{
                let preview = "";
                if (csv && csv.data && csv.data.length > 0 && (header in csv.data[0])){
                preview = csv.data[csvRow||0][header];
                }
                return <Dropdown.Item description={preview} key={index} text={header} onClick={e => {
                    if (onSelection) return onSelection(header);
                    if (props.onChange) return props.onChange({target: {value: (props.value||"")+`{{${header}}}`} })
                }} />
            }) }
            </Dropdown.Menu>
        </Dropdown.Menu>
        : null}
        </Dropdown>
    )
}
