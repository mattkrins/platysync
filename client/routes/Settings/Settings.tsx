import { Alert, Anchor, Button, Code, Container, Grid, Group, Input, LoadingOverlay, Paper, SegmentedControl, Select, Switch, Title, Text, useMantineColorScheme } from "@mantine/core";
import { useForm } from "@mantine/form";
import useAPI from "../../hooks/useAPI";
import { useLocalStorage } from "@mantine/hooks";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { useState } from "react";
import { checkForUpdate, compareVersion } from "../../modules/common";
import { useLocation } from "wouter";
import classes from '../../App.module.css';
import { useAppSelector } from "../../providers/hooks";
import { getVersion } from "../../providers/appSlice";

const initialValues = {
    logLevel: 'info',
    enableRun: false,
} as Settings;

export default function Settings() {
    const version = useAppSelector(getVersion);
    const [_, setLocation] = useLocation();
    const [newVersion, setAvailable] = useState<string|true|undefined>(undefined);
    const { setColorScheme, clearColorScheme } = useMantineColorScheme();
    const [value, setValue, removeValue ] = useLocalStorage<string>({ key: 'mantine-color-scheme-value', defaultValue: 'auto', serialize: v => v, deserialize: (v) => v as string });
    const changeTheme = (value: string)=> {
        if (value==="auto"){ clearColorScheme(); removeValue(); }
        setColorScheme(value as ("auto" | "light" | "dark"));
        setValue(value);
    }
    const form = useForm<Settings>({ initialValues, validate: {} });
    const { loading } = useAPI<Settings>({
        url: "/api/v1/settings", fetch: true,
        then: (e: Settings) => form.setValues(e),
    });
    const { data: success, put: save, loading: saving, error } = useAPI<Settings>({
        url: "/api/v1/settings", form,
        then: (e: Settings) => form.setValues(e),
    });
    const { put: purge, loading: purging } = useAPI({
        url: "/api/v1/settings/purge",
        then: (e: Settings) => { form.setValues(e); console.log(e) },
    });
    const { put: reset, loading: resetting } = useAPI({
        url: "/api/v1/settings/reset",
        then: () => setLocation("/setup"),
    });

    const openResetModal = () =>
    modals.openConfirmModal({
        title: 'Perform Factory Reset?',
        centered: true,
        children: (
        <Text size="sm">
            Are you sure you want to reset this instance of PlatySync?<br/>
            This action is destructive and cannot be reversed.<br/>
            All <b>schemas</b>, <b>users</b>, <b>schedules</b> and <b>settings</b> will be removed.<br/>
            PlatySync will revert to the initial config dialog.
        </Text>
        ),
        labels: { confirm: 'Reset', cancel: "No, don't reset" },
        confirmProps: { color: 'red' },
        onConfirm: () => reset(),
    });
    
    const check = () => {
        setAvailable(true);
        checkForUpdate().then(newVersion=>{
            if ( compareVersion(newVersion, version) > 0 ) setAvailable(newVersion);
        }).catch(()=>setAvailable(undefined));
    }

    return (<Container>
        <Group justify="space-between">
            <Title mb="xs" >Application Settings</Title>
            <Button onClick={()=>save()} loading={saving} >Save</Button>
        </Group>
        <Paper p="lg" className={classes.box} withBorder pos="relative">
            <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 1 }} />
            {!!success&&<Alert mb="xs" icon={<IconCheck size={32} />} color="green">Settings saved successfully.</Alert>}
            {error&&<Alert mb="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
            <Input.Wrapper label="Theme" description="Change colours of the application" >
                <SegmentedControl mt="xs" fullWidth
                onChange={changeTheme}
                defaultValue="auto"
                value={value||"auto"}
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
            <Grid mt="xs">
                <Grid.Col span={4} mih={120}><Input.Wrapper
                label={`Application Version: ${version}`}
                description={newVersion&&typeof newVersion==="string"?<><Text component='span' c="orange" size='xs'>New release v{newVersion} available!</Text><br/>
                Download the latest version from github <Anchor href='https://github.com/mattkrins/platysync/releases' size="xs" target='_blank' >releases</Anchor>.
                </>:'Check for new releases.'}
                ><Button color='green' onClick={()=>check()} loading={!!newVersion&&typeof newVersion!=="string"} mt={5} mb={5} >Check</Button>
                </Input.Wrapper></Grid.Col>
                <Grid.Col span={4}><Input.Wrapper
                label="Clear Cache"
                description="Purges the server cache and sync's the database."
                ><Button loading={!!purging} onClick={()=>purge()} mt={5} mb={5} >Clear</Button>
                </Input.Wrapper></Grid.Col>
                <Grid.Col span={4}><Input.Wrapper
                label="Factory Reset"
                description="Deletes all schemas, users, schedules and settings."
                ><Button color='red' loading={!!resetting} onClick={()=>openResetModal()} mt={5} mb={5} >Reset</Button>
                </Input.Wrapper></Grid.Col>
            </Grid>
            <Switch mt="xs" disabled checked={form.values.enableRun}
            label="Enable Run/Command Action" defaultChecked={false}
            description={<>Enables action which can execute arbitrary system processes/commands.<br/>
            Must be set manually via the <Anchor href='https://github.com/mattkrins/platysync/wiki/Settings#enable-runcommand-action' size="xs" target='_blank' >settings </Anchor> 
            file by adding <Code>"enableRun": true,</Code></>}
            />
        </Paper>
    </Container>
  )
}
