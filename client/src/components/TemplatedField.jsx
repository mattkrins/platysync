import React from 'react'
import { Grid, Icon, Dropdown } from 'semantic-ui-react'
import { templateString } from '../modules/handlebars.js'

import { UseSchemaContext } from '../contexts/SchemaContext'

import SimpleField from './SimpleField'

import CSVSelector from './CSVSelector'

const delimiters = [
    { key: 'none', value: '', text: 'No Delimiter' },
    { key: ',', value: ',', text: 'Comma ,' },
    { key: ';', value: ';', text: 'Semicolon ;' },
    { key: '|', value: '|', text: 'Bar |' },
    { key: 'tab', value: '  ', text: 'Tab' },
    { key: 'space', value: ' ', text: 'Space' },
]

export default function TemplatedField( { delimiter, setDelimiter, ...props} ) {
    const { csv, csvRow, loadingCSV } = UseSchemaContext();
    const preview = templateString(csv||{}, props.value, csvRow||0);
    const invalid = props.previewValidator ? props.previewValidator(preview) : false;
    const error = csv ? invalid || (preview===false && "Invalid Template") : false;
    return (<Grid {...props.grid} >
        <Grid.Row className='pb-0'>
            <Grid.Column>
                <SimpleField {...props} error={error}  >
                    {props.icon&&<Icon name={props.icon} />}
                    <input type={props.type} />
                    {setDelimiter&&<Dropdown
                    button
                    icon={delimiter===""?"ellipsis horizontal":"chevron down"}
                    className='pr-0 ml-2'
                    style={{paddingLeft:"9px"}}
                    value={delimiter}
                    onChange={(e, { value })=>setDelimiter(value)}
                    options={delimiters}
                    trigger={<></>}
                    />}
                    <CSVSelector value={props.value} onChange={props.onChange} loading={loadingCSV} disabled={loadingCSV} />
                </SimpleField>
            </Grid.Column>
        </Grid.Row>
        <Grid.Row  className='p-0'><Grid.Column className="preview" >{preview}</Grid.Column></Grid.Row>
        </Grid>
    )
}
