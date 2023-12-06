import { Loader, Modal, Tabs } from '@mantine/core'
import { IconRun, IconSearch, IconX } from '@tabler/icons-react';
import { useContext, useEffect, useState } from 'react';
import Conditions from '../Editor/Conditions';
import { useForm } from '@mantine/form';
import SchemaContext from '../../../providers/SchemaContext';
import Finder, { match } from './Finder';
import useAPI from '../../../hooks/useAPI';

export default function RunModal( { rule, close }: { rule?: Rule, close: ()=>void } ) {
    const { schema } = useContext(SchemaContext);

    const [activeTab, setActiveTab] = useState<string | null>('conditions');
    const initialValues = {
        secondaries: [],
        conditions: [],
        actions: []
      } as unknown as Rule;
    const form = useForm({ initialValues, validate: {} });
    useEffect(()=>{
        form.reset();
        if (rule) {form.setValues(rule as never)}
    }, [ rule ]);
    const canRun = form.values.conditions.length>0;

    const { data: matches, post, loading, reset: r1, setData: _matches } = useAPI({
        url: `/schema/${schema?.name}/rules/match`,
        data: {...rule, conditions: form.values.conditions},
    });

    const { data: results, post: getResults, loading: running, reset: r2, setData: _results } = useAPI({
        url: `/schema/${schema?.name}/rules/run`,
        data: {
            ...rule,
            conditions: form.values.conditions,
            matches: (matches||[]).filter((m: match)=>m.checked).map((m: match)=>m.id)
        },
    });

    const reset = () => { r1(); r2();  }
    const close2 = () => { reset(); close(); setActiveTab('conditions')  }
    const run = () => {
        setActiveTab('results');
        getResults();
    }

    return (
        <Modal withCloseButton={false} size="80%" opened={!!rule} closeOnClickOutside={false} onClose={close2} styles={{body:{padding: 0}}} >
          {rule&&<Tabs p={0} value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
                <Tabs.Tab disabled={loading} onClick={reset} value="conditions">Conditions</Tabs.Tab>
                <Tabs.Tab disabled={loading||!canRun} leftSection={loading?<Loader size={15}/>:<IconSearch size={15} />} value="matches" onClick={post} >
                    Find Matches
                </Tabs.Tab>
                <Tabs.Tab disabled leftSection={running?<Loader size={15}/>:<IconRun size={15} />} value="results" >
                Results
                </Tabs.Tab>
                <Tabs.Tab ml="auto" disabled value="log">Log</Tabs.Tab>
                <Tabs.Tab leftSection={<IconX size="0.8rem" />} value="close" aria-label="close" onClick={close2} />
            </Tabs.List>
            <Tabs.Panel mih={300} p="xs" pt={0} value="conditions">
                <Conditions form={form} label="Add single-run modifications here."  />
            </Tabs.Panel>
            <Tabs.Panel value="matches">
                <Finder id={rule?.primaryKey} matches={matches||[]} loading={loading} setData={_matches} run={run} />
            </Tabs.Panel>
            <Tabs.Panel value="results">
                <Finder id={rule?.primaryKey} matches={results||[]} loading={running} setData={_results} resultant />
            </Tabs.Panel>
            </Tabs>}
        </Modal>
    )
}
