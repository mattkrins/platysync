import { ActionIcon, Autocomplete, Box, Button, Checkbox, Divider, Group, Menu, Pagination, Table } from "@mantine/core";
import { IconCheckbox, IconEye, IconMenu2, IconSearch } from "@tabler/icons-react";


function Head() {
    return (
    <Group justify="space-between">
        <Autocomplete
        placeholder="Search x entries"
        leftSection={<IconSearch size={16} stroke={1.5} />}
        data={['React', 'Angular']}
        visibleFrom="xs"
        />
        <Group>
            <Pagination total={10} />
            <Menu shadow="md" position="bottom-end" width={200}>
                <Menu.Target>
                    <ActionIcon color="gray" variant="subtle"><IconMenu2 /></ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Label>Filter</Menu.Label>
                    <Menu.Item leftSection={<IconEye size={16} />}>Display Actionless</Menu.Item>
                    <Menu.Item color="red" leftSection={<IconCheckbox size={16} />}>Enable Actionless</Menu.Item>
                    <Menu.Label>Pagination</Menu.Label>
                    <Menu.Item>10 Per Page</Menu.Item>
                    <Menu.Item>25 Per Page</Menu.Item>
                    <Menu.Item>50 Per Page</Menu.Item>
                    <Menu.Item>100 Per Page</Menu.Item>
                    <Menu.Item>No Pagination</Menu.Item>
                </Menu.Dropdown>
            </Menu>
            
        </Group>
        <Button>Apply actions (x)</Button>
    </Group>
    )
}

export default function Evaluate() {
    return (
    <Box>
        <Divider mb="xs"/>
        <Head/>
        <Divider mt="xs"/>
        <Table>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th><Checkbox /></Table.Th>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Display</Table.Th>
                    <Table.Th>Actions</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody></Table.Tbody>
        </Table>
    </Box>
    )
}
