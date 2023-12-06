import React, { useState } from 'react'
import { Menu, Button, Grid, Modal } from 'semantic-ui-react'

export default function Wizard( { M, close, noContinue, finishing, finish, tabList, tabs, finishText, allowNavigation, ...props } ) {
    const [ tab, setTab ] = useState(0);
    const actions =
    <Modal.Actions>
        <Button disabled={tab<=0||finishing} content="Back" color='black' onClick={() => setTab(tab-1)} />
        {tab<3&&<Button disabled={noContinue&&noContinue(tab)} content="Next" positive onClick={() => setTab(tab+1)} />}
        {tab>=3&&<Button disabled={(noContinue&&noContinue(tab))||finishing} loading={finishing} content={finishText||"Finish"} primary onClick={()=>finish()} />}
        <Button disabled={finishing} content="Cancel" color='red' onClick={() => close()} />
    </Modal.Actions>

    return (
        <M closeOnDimmerClick={false} closeOnEscape={false} actions={actions} {...props} >
            <Grid>
                <Grid.Column width={2} className="pr-2">
                    <Menu fluid vertical>
                        {tabList.map((t, i)=><Menu.Item key={i} onClick={()=>allowNavigation?setTab(i):undefined} active={tab===i}>{t}</Menu.Item>)}
                    </Menu>
                </Grid.Column>
                <Grid.Column stretched width={14} className="pl-0">
                    {tabs.filter((t, i)=>tab===i).map((t, i)=><Menu.Item key={i} active={tab===i}>{t}</Menu.Item>)}
                </Grid.Column>
            </Grid>
        </M>
    )
}
