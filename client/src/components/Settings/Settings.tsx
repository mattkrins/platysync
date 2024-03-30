import { Button, Input, SegmentedControl, useMantineColorScheme, Text } from '@mantine/core'
import Container from '../Common/Container';
import { useContext } from 'react';
import useAPI from '../../hooks/useAPI';
import SchemaContext from '../../providers/SchemaContext';
import { notifications } from '@mantine/notifications';
import AuthContext from '../../providers/AuthContext';

export default function Settings() {
    const { setColorScheme, clearColorScheme } = useMantineColorScheme();
    const { version } = useContext(AuthContext);
    const { changeSchema } = useContext(SchemaContext);
    const { get: purge, loading: purging } = useAPI({
        url: `/fix`,
        then: () => {
            changeSchema(undefined);
            notifications.show({ title: "Success",message: 'Cache Purged.', color: 'lime', });
            setTimeout(()=> location.reload(), 1000)
        }
    });
    return (
    <Container label='Application Settings' >
        <Text c="dimmed" >Application Version: {version}</Text>
        <Input.Wrapper
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
        <Input.Wrapper
        label="Clear Cache"
        description="Purges the server cache to fix schema inconsistencies, etc."
        >
        <Button loading={!!purging} onClick={()=>purge()} mt={5} >Fix</Button>
        </Input.Wrapper>
    </Container>
    )
}