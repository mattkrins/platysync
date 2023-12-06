import { Card, Group, Modal, SimpleGrid, Text, UnstyledButton, useMantineTheme } from '@mantine/core'
import classes from './AddConnectors.module.css'
import providers from '../../modules/connectors.ts'

export default function AddConnectors({ opened, close, add }: { opened: boolean, close(): void, add(provider: string): void }) {
    const theme = useMantineTheme();
    return (
    <Modal size="lg" styles={{content:{backgroundColor:'transparent'},body:{padding:0,margin:0} }} opened={opened} onClose={close} withCloseButton={false}>
        <Card mih={300} withBorder radius="md" className={classes.card}>
            <Group justify="space-between">
                <Text className={classes.title}>Select a provider</Text>
            </Group>
            <SimpleGrid cols={2} mt="md">
            {Object.values(providers).map((item) =>
            <UnstyledButton onClick={()=>add(item.id)} key={item.id} className={classes.item}>
                <item.icon color={theme.colors[item.color][6]} size="2rem" />
                <Text size="xs" mt={7}>{item.name}</Text>
            </UnstyledButton>
            )}
            </SimpleGrid>
        </Card>
    </Modal>
    )
}
