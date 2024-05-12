import { Button, Input, SegmentedControl, useMantineColorScheme, Text, Anchor, Select, TextInput, Grid, Switch, Code } from '@mantine/core'
import Container from '../Common/Container';
import { useContext, useEffect, useState } from 'react';
import useAPI from '../../hooks/useAPI';
import SchemaContext from '../../providers/SchemaContext2';
import { notifications } from '@mantine/notifications';
import AuthContext, { settings } from '../../providers/AppContext';
import { modals } from '@mantine/modals';
import { useLocalStorage } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import Head from '../Common/Head';
import { IconDeviceFloppy } from '@tabler/icons-react';
import axios from 'axios';

export default function Settings() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_1, _2, clear] = useLocalStorage({ key: 'setup', defaultValue: 'false' });
    const { setColorScheme, clearColorScheme } = useMantineColorScheme();
    const { version, logout, settings, setSettings, refreshSchemas } = useContext(AuthContext);
    const [checking, setChecking] = useState<boolean>(false);
    const [upgradeAvailable, setAvailable] = useState<string|undefined>(undefined);
    const { close } = useContext(SchemaContext);
    const form = useForm({ initialValues: settings, validate: {} });
    useEffect(()=>{ form.setValues(settings) }, [ settings ] )
    const { put: save, loading } = useAPI<settings>({
        url: `/settings`,
        form,
        data: form.values,
        then: data => {
            setSettings(data);
            notifications.show({ title: "Setting Saved",message: 'Cache Purged.', color: 'lime', });
            refreshSchemas();
        }
    });
    const { del: purge, loading: purging } = useAPI({
        url: `/reset_cache`,
        then: () => {
            close();
            notifications.show({ title: "Success",message: 'Cache Purged.', color: 'lime', });
            setTimeout(()=> location.reload(), 1000)
        }
    });
    const { del: reset, loading: resetting } = useAPI({
        url: `/reset_all`,
        then: () => {
            close();
            clear();
            logout();
            notifications.show({ title: "Success",message: 'Reset Complete.', color: 'lime', });
            setTimeout(()=> location.reload(), 1000)
        }
    });

    const openResetModal = () =>
    modals.openConfirmModal({
        title: 'Perform Factory Reset?',
        centered: true,
        children: (
        <Text size="sm">
            Are you sure you want to reset this instance of PlatySync?<br/>
            This action is destructive and cannot be reversed.<br/>
            All <b>users</b>, <b>schedules</b> and <b>settings</b> will be removed.<br/>
            PlatySync will revert to the initial config dialog.<br/>
            Schemas will <b>not</b> be removed.
        </Text>
        ),
        labels: { confirm: 'Reset', cancel: "No, don't reset" },
        confirmProps: { color: 'red' },
        onConfirm: () => reset(),
    });

    const check = () => {
        setChecking(true);
        const axiosClient = axios.create({headers: {'X-GitHub-Api-Version': '2022-11-28'}});
        axiosClient.get("https://api.github.com/repos/mattkrins/platysync/releases")
        .catch(error=>{ console.error('Failed to get latest version', error); form.setFieldError('version', error.message); })
        .finally(()=>setChecking(false))
        .then((( response )=>{
            if (!response) return;
            const { data: releases } = response as { data: {name: string}[] };
            const { name: latest } = releases[0];
            if ( version && (parseFloat(latest) > parseFloat(version))){ setAvailable(latest); } else { return form.setFieldError('version', `Running latest release: v${version}.`); }
            notifications.show({ title: `Version ${latest} available`,message: `New version ${latest} available.`, color: 'orange', });
        }));
    }
    useEffect(()=>{ if (version) check(); }, [ version ]);
    
    return (
    <Container label={<Head rightSection={<Button onClick={()=>save()} leftSection={<IconDeviceFloppy size={16} />} loading={loading} variant="light">Save</Button>} >Application Settings</Head>} >
        <Input.Wrapper mt="xs"
        label="Theme"
        description="Change colours of the application"
        >
        <SegmentedControl mt="xs" fullWidth
        onChange={(value: string)=>value==="auto"?clearColorScheme():setColorScheme(value as ("auto" | "light" | "dark")) }
        data={[
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
            { label: 'Auto', value: 'auto' },
        ]}
        />
        </Input.Wrapper>
        <Select mt="xs"
        label="Log Level" description="Log level for debugging purposes. Default: info"
        placeholder="Pick a log level"
        defaultValue="info"
        data={['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']}
        {...form.getInputProps('logLevel')}
        />
        <TextInput mt="xs"
            label="Schema Location"
            description="Directory containing schema files. Default: %appdata%/platysync/schemas"
            placeholder="D:/schemas"
            {...form.getInputProps('schemasPath')}
        />
        <Grid mt="xs">
            <Grid.Col span={4} mih={120}><Input.Wrapper error={form.getInputProps('version').error}
            label={`Application Version: ${version}`}
            description={upgradeAvailable?<><Text component='span' c="orange" size='xs'>New release v{upgradeAvailable} available!</Text><br/>
            Download the latest version from the github <Anchor href='https://github.com/mattkrins/platysync/releases' size="xs" target='_blank' >releases</Anchor> page.
            </>:'Check for new releases.'}
            ><Button color='green' loading={checking} onClick={()=>check()} mt={5} mb={5} >Check</Button>
            </Input.Wrapper></Grid.Col>
            <Grid.Col span={4}><Input.Wrapper
            label="Clear Cache"
            description={<>Purges the server cache and <Anchor href='https://sequelize.org/docs/v6/core-concepts/model-basics/#model-synchronization' size="xs" target='_blank' >sync's</Anchor> the database.</>}
            ><Button loading={!!purging} onClick={()=>purge()} mt={5} mb={5} >Clear</Button>
            </Input.Wrapper></Grid.Col>
            <Grid.Col span={4}><Input.Wrapper
            label="Factory Reset"
            description="Delete all users, schedules and settings."
            ><Button color='red' loading={!!resetting} onClick={()=>openResetModal()} mt={5} mb={5} >Reset</Button>
            </Input.Wrapper></Grid.Col>
        </Grid>
        <Switch mt="xs" disabled checked={form.values.enableRun}
        label="Enable Run/Command Action"
        description={<>Enables action which can execute arbitrary system processes/commands.<br/>
        Must be set manually via the <Anchor href='https://github.com/mattkrins/platysync/wiki/Settings#enable-runcommand-action' size="xs" target='_blank' >settings</Anchor> file by adding <Code>enableRun: true</Code></>}
        />
        
    </Container>
    )
}