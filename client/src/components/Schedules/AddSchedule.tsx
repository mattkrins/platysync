import { Box, Button, Center, Group, Loader, Modal, MultiSelect, SegmentedControl, Select, TextInput, Text } from '@mantine/core'
import useAPI from '../../hooks/useAPI';
import { UseFormReturnType } from '@mantine/form';
import { useEffect } from 'react';
import { IconCalendar, IconFileSignal } from '@tabler/icons-react';
import cronstrue from 'cronstrue';
import { schedule } from './Schedules';

interface Props {
    opened: boolean;
    editing?: schedule;
    loading: boolean;
    close(): void;
    add(): void;
    save(options: object): void;
    form: UseFormReturnType<{ schema: string, type: string, rules: never[], cron: string, monitor: string }>
}

export default function AddSchedule({ opened, close, editing, loading = false, add, save, form }: Props) {
    const { data: schemas = [], loading: loadingSchemas } = useAPI({
        url: "/schema",
        default: [],
        fetch: true,
        mutate: (schemas: Schema[]) => schemas.map(s=>s.name),
    });
    const { data: rules = [], loading: loadingRules, get: getRules, error: e1 } = useAPI({
        url: `/schema/${form.values.schema}/rules/`,
        default: [],
        mutate: (rules: Rule[]) => rules.map(s=>s.name),
    });

    useEffect(()=>{ if (form.values.schema) getRules(); },[ form.values.schema ]);

    const cron = cronstrue.toString(form.values.cron, { throwExceptionOnParseError: false });
    const invalidCron = cron.includes("An error occured when generating the expression description");
    const noClick = !form.values.schema;

    const click = () =>{
        if (editing) return save({id: editing.id});
        add();
    }

    return (
    <Modal size="lg" opened={opened} onClose={close} title="Add Schedule" >
        <Select
        label="Target Schema" required
        placeholder="Pick schema"
        data={schemas} rightSection={loadingSchemas?<Loader size="xs" />:undefined}
        {...form.getInputProps('schema')}
        />
        {form.values.schema&&<>
        <MultiSelect
        label="Rules" clearable
        description="Specify which rules will be run on the schema. Leave blank to run all."
        placeholder={form.values.rules.length<=0?"All rules":"Pick rules"}
        disabled={rules.length<=0}
        data={rules} rightSection={loadingRules?<Loader size="xs" />:undefined}
        {...form.getInputProps('rules')}
        error={e1}
        />
        <Text fz="xs" c="dimmed" >Note: Disabled rules will be skipped regardless.</Text>
        <SegmentedControl mt={5} fullWidth 
        {...form.getInputProps('type')}
        data={[
            { label: <Center><IconCalendar size={20} stroke={1.5} /><Box ml={5} >Schedule</Box></Center>, value: 'Schedule' },
            { label: <Center><IconFileSignal size={20} stroke={1.5} /><Box ml={5} >Monitor</Box></Center>, value: 'Monitor' },
        ]}
        />
        {form.values.type==="Schedule"&&<TextInput
        label="CRON Expression" // https://croner.56k.guru/usage/pattern/
        placeholder={'0 * * * MON-FRI'} required
        description={invalidCron ? "Invalid Syntax" : cron}
        {...form.getInputProps('cron')}
        error={invalidCron && cron}
        />}
        {form.values.type==="Monitor"&&<TextInput
        label="File Path"
        placeholder="D:/watchme.csv" required
        description="This file path will be monitored, and the schedule run when a file change is detected."
        {...form.getInputProps('monitor')}
        />}
        </>}
        <Group justify="right" mt="md"><Button loading={loading} disabled={noClick} onClick={click} variant="light" type="submit" >{editing?'Save':'Add'}</Button></Group>
    </Modal>
    )
}
