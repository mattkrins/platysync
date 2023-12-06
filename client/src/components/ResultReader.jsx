import React, { useState } from 'react'
import { List, Table, Icon, Modal, Button } from 'semantic-ui-react'

import { actions, trimString } from '../modules/common.js'

export default function ResultReader( { M, reading, real, findPrint, close, ...props } ) {
    const [showData, showData_] = useState(false);
    const [showAttributes, showAttributes_] = useState(false);
    const [showChanges, showChanges_] = useState(true);
    const [showMatches, showMatches_] = useState(false);
    const action = actions[reading.type];
    const results = reading.result;
    const addedGroups = (results.subActions||[]).filter(a=>a.type==="addgroup");
    const removedGroups = (results.subActions||[]).filter(a=>a.type==="removegroup");
    const attributeChanges = (results.subActions||[]).filter(a=>a.type==="editattribute");
    const buttons =
    <Modal.Actions>
        <Button content="Print" icon="print" color='black' onClick={() => {findPrint(reading.job, reading.sam)();close();}} />
    </Modal.Actions>
    
    return (
        <M {...props} name={`${action.name} ${reading.cn}`} icon={action.icon} actions={reading.job&&reading.job.source&&buttons} >
            <List>
                <List.Item><List.Header>User ID</List.Header>{reading.sam}</List.Item>
                <List.Item><List.Header>User Name</List.Header>{reading.cn}</List.Item>
                <List.Item><List.Header>Schema</List.Header>{reading.schema}</List.Item>
                <List.Item><List.Header>Rule</List.Header>{reading.rule.name}{reading.rule.description&&<i><br/>{reading.rule.description}</i>}</List.Item>
                <List.Item>
                    <List.Header>Condition Matches <Icon onClick={()=>showMatches_(!showMatches)} link name={showMatches?"eye slash outline":"eye"} /></List.Header>
                    {(reading.matches||[]).length>0&&showMatches&&<Table basic size='small'>
                            <Table.Header><Table.Row>
                                <Table.HeaderCell content="Key" /><Table.HeaderCell content="Operator" /><Table.HeaderCell content="Value" />
                            </Table.Row></Table.Header>
                            <Table.Body>{(reading.matches||[]).map((m, i)=>
                                <Table.Row key={i} >
                                    <Table.Cell>{trimString(m.key, 25)}</Table.Cell><Table.Cell>{m.operator}</Table.Cell><Table.Cell>{trimString(m.value, 25)}</Table.Cell>
                                </Table.Row> )}
                            </Table.Body>
                    </Table>}
                </List.Item>
                {reading.error&&<List.Item style={{color:"red"}}><List.Header>Error</List.Header>{String(reading.error)}</List.Item>}
                <List.Item>
                    <List.Header>Data <Icon onClick={()=>showData_(!showData)} link name={showData?"eye slash outline":"eye"} /></List.Header>
                    {showData&&<Table basic>
                        <Table.Header><Table.Row><Table.HeaderCell content="Key" /><Table.HeaderCell content="Value" /></Table.Row></Table.Header>
                        <Table.Body>
                        {Object.keys(reading.data||{}).map(key=>
                            <Table.Row key={key} ><Table.Cell>{key}</Table.Cell><Table.Cell>{reading.data[key]}</Table.Cell></Table.Row> )}
                        </Table.Body>
                    </Table>}
                </List.Item>
                {results&&<>
                    {results.userAttributes&&
                    <List.Item>
                        <List.Header>Directory Attributes <Icon onClick={()=>showAttributes_(!showAttributes)} link name={showAttributes?"eye slash outline":"eye"} /></List.Header>
                        {showAttributes&&<Table basic>
                            <Table.Header><Table.Row><Table.HeaderCell content="Key" /><Table.HeaderCell content="Value" /></Table.Row></Table.Header>
                            <Table.Body>{Object.keys(results.userAttributes).map(key=>
                                <Table.Row key={key} ><Table.Cell>{key}</Table.Cell><Table.Cell style={{maxWidth:"400px",overflow:"auto"}} >{results.userAttributes[key]}</Table.Cell></Table.Row> )}
                            </Table.Body>
                        </Table>}
                    </List.Item>}
                    {results&&
                    <List.Item>
                        <List.Header>
                            {reading.type==="create"?'Additions ':'Directory Changes '} 
                            <Icon onClick={()=>showChanges_(!showChanges)} link name={showChanges?"eye slash outline":"eye"} />
                        </List.Header>
                        {showChanges&&<>
                        {reading.type==="move"&&<>
                        <b>Move{real?'d':''} From:</b> <i>{results.from}</i><br/>
                        <b>To</b>: <i>{results.to}</i>
                        </>}
                        {results.action&&`${actions[results.action].name}${real?'d user':' user'}`}
                        {attributeChanges.length>0&&<Table basic size='small'>
                            <Table.Header><Table.Row><Table.HeaderCell content="Update Attribute" /><Table.HeaderCell content="From" /><Table.HeaderCell content="To" /></Table.Row></Table.Header>
                            <Table.Body>{attributeChanges.map((a, i)=>
                                <Table.Row error={!!a.error} key={i} >
                                    <Table.Cell>{a.key}</Table.Cell><Table.Cell>{trimString(a.current, 35)}</Table.Cell>
                                    <Table.Cell>{trimString(a.expected, 35)}{a.error&&<><br/>{a.error}</>}</Table.Cell>
                                </Table.Row> )}
                            </Table.Body>
                        </Table>}
                        {addedGroups.length>0&&<Table basic size='small'>
                            <Table.Header><Table.Row><Table.HeaderCell content={`${real?'Added':'Add'} Security groups`} /></Table.Row></Table.Header>
                            <Table.Body>{addedGroups.map((a, i)=>
                                <Table.Row error={!!a.error} key={i} ><Table.Cell>{a.value}{a.error&&`: ${String(a.error)}`}</Table.Cell></Table.Row> )}
                            </Table.Body>
                        </Table>}
                        {removedGroups.length>0&&<Table basic size='small'>
                            <Table.Header><Table.Row><Table.HeaderCell content={`${real?'Removed':'Remove'} Security groups`} /></Table.Row></Table.Header>
                            <Table.Body>{removedGroups.map((a, i)=>
                                <Table.Row error={!!a.error} key={i} ><Table.Cell>{a.value}{a.error&&`: ${String(a.error)}`}</Table.Cell></Table.Row> )}
                            </Table.Body>
                        </Table>}
                        </>}
                    </List.Item>}
                </>}
                {reading.job&&<List.Item><List.Header>Save{real?'d':''} file to path</List.Header>{reading.job.path}</List.Item>}
                {reading.rule.print&&<List.Item><List.Header>File Action</List.Header>File will be printed</List.Item>}
            </List>
        </M>
    )
}
