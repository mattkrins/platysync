import { Button, Input, SegmentedControl, useMantineColorScheme, Text } from '@mantine/core'
import Container from '../Common/Container';
import { useContext } from 'react';
import useAPI from '../../hooks/useAPI';
import SchemaContext from '../../providers/SchemaContext2';
import { notifications } from '@mantine/notifications';
import AuthContext from '../../providers/AppContext';
import { modals } from '@mantine/modals';
import { useLocalStorage } from '@mantine/hooks';

export default function Settings() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_1, _2, clear] = useLocalStorage({ key: 'setup', defaultValue: 'false' });
    const { setColorScheme, clearColorScheme } = useMantineColorScheme();
    const { version, logout } = useContext(AuthContext);
    const { close } = useContext(SchemaContext);
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

    return (
    <Container label='Application Settings' >
        <Text c="dimmed" >Application Version: {version}</Text>
        <Input.Wrapper mt="xs"
        label="Theme"
        description="Change colours of the application"
        >
        <SegmentedControl mt="xs" fullWidth maw={300}
        onChange={(value: string)=>value==="auto"?clearColorScheme():setColorScheme(value as ("auto" | "light" | "dark")) }
        data={[
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
            { label: 'Auto', value: 'auto' },
        ]}
        />
        </Input.Wrapper>
        <Input.Wrapper mt="xs"
        label="Clear Cache"
        description="Purges the server cache to fix schema inconsistencies, etc."
        >
        <Button loading={!!purging} onClick={()=>purge()} mt={5} >Clear</Button>
        </Input.Wrapper>
        <Input.Wrapper mt="xs"
        label="Factory Reset"
        description="Delete all users, schedules and settings."
        >
        <Button color='red' loading={!!resetting} onClick={()=>openResetModal()} mt={5} >Reset</Button>
        </Input.Wrapper>
    </Container>
    )
}