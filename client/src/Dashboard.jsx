import React, { useState, useEffect } from 'react'
import { Container, Segment, Statistic, Icon, Grid, Menu, Label, Button, Card, Dropdown, Progress } from 'semantic-ui-react'
import { actions } from './modules/common.js'

import ResultTable from './components/ResultTable'

import useFetch from './hooks/useFetch'
import useSocket from './hooks/useSocket';


export default function Dashboard( { schemaName, schemas, nav, setNav } ) {
    const [ selectedSchema, setSelectedSchema ] = useState(false);
    const [ selectedRows, setSelectedRows ] = useState([]);
    useEffect(()=>setSelectedSchema(schemaName), [ schemaName ]);
    const [ progress ] = useSocket( "progress", { default: { count: 0, status: "Idle" } } );
    const [ totals, setTotals ] = useSocket( "totals", {
      default: {update:0,delete:0,move:0,enable:0,disable:0,create:0},
      set: false,
      then: t => nav ? setTotals({...totals, ...t}) : setTotals(t)
    } );
    const [ prints, setPrints ] = useSocket( "prints", {
      default: {},
      set: false,
      then: t => setPrints({...prints, ...t})
    } );

    const changeTab = (t, load = false) => {
      setNav(t);
      reset();
      if (load) run();
    }
    
    const Tab = ({a, i}) => {
      const count = totals[i]||0;
      return <Menu.Item onClick={()=>{ changeTab(a.name); }} active={nav===a.name} >
      {count > 0 && <Label color={a.color}>{count}</Label>}{a.name}
      {(a.icon&&count <= 0)&&<Icon color={a.color} name={a.icon}/>}
      </Menu.Item>
    }

    const Stat = ({a, i}) => {
      const count = totals[i]||0;
      return <Statistic color={a.color}>
        <Statistic.Value><Icon name={a.icon} onClick={()=>{ changeTab(a.name); }} link />{count}</Statistic.Value>
        <Statistic.Label>To {a.name}</Statistic.Label>
      </Statistic>
    }

    const { fetch: print, loading: printing } = useFetch({ method: "post" });

    const { data: results, fetch: run, loading: running, reset, request } = useFetch({
      url: "/check",
      method: "post",
      default: {},
      data: {
        SchemaName: selectedSchema,
        RuleType: nav ? nav.toLowerCase() : false,
      }
    });
    const printAll = () => () => {
      print({
        url: `/print`,
        method:"post",
        SchemaName: selectedSchema,
      })
    }
    const realRun = () => () => {
      run({real: true, data:{
        SchemaName: selectedSchema,
        RuleType: nav ? nav.toLowerCase() : false,
        UserFilter: selectedRows,
        real: true
      }});
    }
    const schemaNames = [{key:"all",text:"Check All Schemas",value:false}, ...(schemas||[]).map(s=>({key:s.name,text:s.name,value:s.name}))];
    const action = nav ? actions[nav.toLowerCase()] : { name: "Run", icon: "play", color: "violet" };
    return (
      <Container>
        <Segment>
          <Statistic.Group size='small' widths={7}>
              {Object.keys(actions).map(a=><Stat a={actions[a]} key={a} i={a} />)}
          </Statistic.Group>
        </Segment>
        <Grid>
          <Grid.Column width={4}>
            <Menu fluid vertical>
              <Menu.Item active={!nav} onClick={()=>{ changeTab(false); }}>Overview</Menu.Item>
              {Object.keys(actions).map(a=><Tab a={actions[a]} key={a} i={a} />)}
            </Menu>
          </Grid.Column>
          <Grid.Column stretched width={12}>
            <Segment basic className='p-0' >
              <Menu borderless secondary >
                  <Menu.Item className='p-0'>
                      <Button.Group secondary>
                        <Button onClick={()=>run()} loading={running&&selectedRows<=0} disabled={running&&selectedRows<=0} ><Icon name="sync" />Check {selectedSchema?selectedSchema:'All Schemas'}</Button>
                        <Dropdown className='button icon' options={schemaNames} disabled={running&&selectedRows<=0} trigger={<></>}  onChange={(_,{value})=>setSelectedSchema(value)} />
                      </Button.Group>
                  </Menu.Item>
                  <Menu.Menu position='right'>
                      <Button loading={(running&&selectedRows>0)||printing}
                      disabled={nav==="Print"?((results.sorted||[]).length<=0)||printing:(selectedRows<=0||running)}
                      onClick={nav==="Print"?printAll():realRun()} as='div' labelPosition='right'>
                      <Button color={action.color} >
                          <Icon name={action.icon} />{action.name} {selectedSchema ? selectedSchema : "All"}
                      </Button>
                      <Label as='a' basic color={action.color} pointing='left'>{nav==="Print"?(results.sorted||[]).length:selectedRows.length}/{(results.sorted||[]).length}</Label>
                      </Button>
                  </Menu.Menu>
              </Menu>
              <Card fluid>
                {!!(progress.count) && <Progress percent={progress.count} color='blue' attached='top' indicating autoSuccess  />}
                <Card.Content style={{minHeight:"227px"}} >
                  <ResultTable
                  status={progress.status}
                  errors={results.errors||[]}
                  results={results.sorted||[]}
                  selected_={selectedRows}
                  setSelected_={setSelectedRows}
                  real={request.real}
                  action={nav ? nav.toLowerCase() : false}
                  run={run}
                  running={running}
                  changeTab={changeTab}
                  selectedSchema={selectedSchema}
                  prints={prints}
                  printJob={print}
                  />
                </Card.Content>
              </Card>
            </Segment>
          </Grid.Column>
        </Grid>
      </Container>
    )
}
