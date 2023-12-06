import React, { useState, useEffect } from 'react'
import { Table, Checkbox, Label, Icon, Pagination, Dropdown, Menu, Header, Input, Button, Segment, Popup } from 'semantic-ui-react'

import { actions, trimString } from '../modules/common.js'

import useModal from '../hooks/useModal'

import ResultReader from './ResultReader'

export default function ResultTable( { results, real, selected_, setSelected_, action, run, running, status, changeTab, selectedSchema, prints, printJob, errors } ) {
    const { Modal: M, open, close } = useModal({name:"Error"});
    const [reading, setReading] = useState(false);
    const [selected, setSelected] = useState({});
    const [filter, setFilter] = useState("");
    const [perPage, setPerPage] = useState(10);
    const [page, setPage] = useState(1);
    useEffect(()=>setPage(1), [ filter ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(()=>{setSelected({});setSelected_([]);}, [ action, running ])

    const toggle = (sam) => () => {
        setSelected_(selected_=>selected[sam]?selected_.filter(s=>s!==sam) : [...selected_, sam ] )
        setSelected(selected=>({...selected, [sam]: !selected[sam] }));
    }
    const someSelected = selected_.length === results.length;
    const toggleAll = () => {
        if (someSelected) { setSelected_([]); setSelected({}); return; }
        const all = results.map(r=>r.sam);
        setSelected_(all);
        const obj = {};
        for (const sam of all) obj[sam] = true;
        setSelected(obj);
    }

    const pageOptions = [
        { key: '1', text: '1', value: '1' },
        { key: '10', text: '10', value: '10' },
        { key: '20', text: '20', value: '20' },
        { key: '50', text: '50', value: '50' },
        { key: '100', text: '100', value: '100' },
        { key: '1000', text: '1000', value: '1000' },
    ]
    const filtered = results.filter( r =>
        (r.cn || "").toLowerCase().includes(filter.toLowerCase()) ||
        (r.sam || "").toLowerCase().includes(filter.toLowerCase()) ||
        (r.type || "").toLowerCase() === (filter.toLowerCase()) ||
        ((!r.error) && (filter.toLowerCase()==="success")) ||
        ((r.error) && (filter.toLowerCase()==="error"))
    );
    const totalPages = Math.ceil(filtered.length/perPage);
    const paginated = filtered.slice((page-1)*perPage, page*perPage);
    const showPagination = filtered.length>=Number(pageOptions[0].value);
    const showReader = (r) => () => {
        setReading(r);
        open();
    }
    const findPrint = (job,sam) => () => {
        if (!job) return;
        setFilter(sam)
        changeTab("Print")
        run({data:{
            SchemaName: selectedSchema,
            RuleType: "print",
        }});
    }
    const print = (id) => () => {
        if (!id) return;
        printJob({url: `/print/${id}`})
    }
    const delJob = (id) => () => {
        if (!id) return;
        printJob({url: `/print/${id}`,method:"delete"})
    }
    return (
        <>
        {reading&&<ResultReader M={M} size="small" real={real} reading={reading} onClose={()=>setReading(false)} findPrint={findPrint} close={close}  />}
        <Menu attached='top' tabular >
            <Menu.Item className='p-0 text'><Header as='h3' >Status: {status}</Header></Menu.Item>
          <Menu.Menu position='right'>
            <Menu.Item className='p-0'><Input onChange={e => setFilter(e.target.value)} value={filter} transparent icon={{ name: 'search', link: true }} placeholder='Filter...' /></Menu.Item>
          </Menu.Menu>
        </Menu>
        {errors.length>0&&
        <Segment basic compact className='p-0'>
            {errors.map((e, i) =><Label key={i} color='red' className='mb-1'>{e.schema}<Label.Detail>{trimString(e.message,130)}</Label.Detail></Label>)}
        </Segment>}
        {results.length<=0?<div className="pt-4" >
            No pending users found.<br/><br/>
            Run a <Button className='p-1' basic compact onClick={run}  disabled={running} >check</Button>to find users{action?` to ${action}.`:'.'}
        </div>:
        <Table striped>
            <Table.Header>
                {action==="print"?
                <Table.Row>
                    <Table.HeaderCell collapsing>Schema</Table.HeaderCell>
                    <Table.HeaderCell collapsing>User</Table.HeaderCell>
                    <Table.HeaderCell>Path</Table.HeaderCell>
                    <Table.HeaderCell collapsing>Status</Table.HeaderCell>
                    <Table.HeaderCell collapsing>Print</Table.HeaderCell>
                    <Table.HeaderCell collapsing>Delete</Table.HeaderCell>
                </Table.Row>:
                <Table.Row>
                    {!real&&<Table.HeaderCell collapsing content={<Checkbox toggle checked={someSelected} onClick={toggleAll} />} />}
                    <Table.HeaderCell collapsing>Schema</Table.HeaderCell>
                    <Table.HeaderCell collapsing>User</Table.HeaderCell>
                    <Table.HeaderCell>Name</Table.HeaderCell>
                    <Table.HeaderCell collapsing>Rule</Table.HeaderCell>
                    {real&&<Table.HeaderCell>Result</Table.HeaderCell>}
                    {real&&<Table.HeaderCell collapsing />}
                </Table.Row>}
            </Table.Header>
            <Table.Body>
            {paginated.map((r, i)=> {
            const subActions = (r.result||{}).subActions || [];
            const warnings = subActions.filter(a=>a.error);
            const status = prints[r.id]||"Idle";
            const stat = status==="Spooling" ? {i:"spinner",c:"blue",l:true} :
            status==="Complete" ? {i:"check",c:"green"} :
            status==="Deleted" ? {i:"check",c:"red",d:true} :
            status==="Error" ? {i:"cancel",c:"red"} : {};
            if (action==="print") return (
                <Table.Row key={i} error={status==="Error"} >
                    <Table.Cell collapsing>{r.SchemaName}</Table.Cell>
                    <Table.Cell collapsing>{r.sam}</Table.Cell>
                    <Table.Cell>{trimString(r.path, 60)}</Table.Cell>
                    <Table.Cell collapsing><Label content={status} color={stat.c} icon={stat.i&&<Icon name={stat.i} loading={stat.l} />} /></Table.Cell>
                    <Table.Cell collapsing content={<Button onClick={print(r.id)} icon="print" color='black' loading={stat.l} disabled={stat.l||stat.d} />} />
                    <Table.Cell collapsing content={<Button onClick={delJob(r.id)} icon="cancel" color='red' disabled={stat.l||stat.d}  />} />
                </Table.Row>
            );
            return (
            <Table.Row key={r.sam} error={r.error||!r.cn} warning={(!r.error&&warnings.length>0)} >
                {!real&&<Table.Cell disabled={!!r.error||!r.cn} collapsing content={<Checkbox toggle checked={!!selected[r.sam]} onClick={toggle(r.sam)} />}  />}
                <Table.Cell collapsing>{r.schema}</Table.Cell>
                <Table.Cell collapsing>{selected[r.sam] ? <b>{r.sam}</b> : r.sam }</Table.Cell>
                <Table.Cell>{r.cn}</Table.Cell>
                <Table.Cell onClick={showReader(r)} collapsing>
                    <Label as='a' color={actions[r.type].color} ><Icon name={actions[r.type].icon} /> {r.rule.name}</Label>
                    {r.rule.gen_pdf&&<><Icon name="chevron right" className='m-0' /><Popup content='Writes to PDF' trigger={<Icon name="file pdf" className='m-0' />} /></>}
                    {r.rule.print&&<><Icon name="chevron right" className='m-0' /><Popup content='Sends PDF to printer' trigger={<Icon name="print pdf" className='m-0' />} /></>}
                </Table.Cell>
                {real&&
                <Table.Cell>
                    <Label color={r.error?"red":warnings.length>0?"orange":"green"} content={r.error?"Error":warnings.length>0?"Warning":"Success"} />
                </Table.Cell>}
                {real&&<Table.Cell onClick={findPrint(r.job,r.sam)} collapsing >{r.rule.gen_pdf&&<Icon name="print" link size='large' />}</Table.Cell>}
            </Table.Row>)})}
            </Table.Body>
            {showPagination&&
            <Table.Footer>
                <Table.Row>
                    <Table.HeaderCell colSpan='6'>
                    <Pagination
                        activePage={page}
                        pointing
                        secondary
                        totalPages={totalPages>0 ? totalPages : 1}
                        onPageChange={(e, { activePage })=>{ setPage(activePage); }}
                    />
                    <Dropdown className='p-2' inline text={String(perPage)} value={perPage} options={pageOptions} onChange={(e, { value }) => setPerPage(value)} />rows per Page
                    </Table.HeaderCell>
                </Table.Row>
            </Table.Footer>}
        </Table>}
        </>
    )
}
