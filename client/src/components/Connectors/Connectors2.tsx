import { useContext, useState } from 'react';
import SchemaContext from '../../providers/SchemaContext';
import Container from '../Common/Container';
import Head from '../Common/Head';
import { Button, Badge, Table, Group, Text, ActionIcon, rem, useMantineTheme } from '@mantine/core';
import { IconCopy, IconPencil, IconTestPipe, IconTrash } from '@tabler/icons-react';
import providers from '../../modules/connectors.ts'
import { useDisclosure } from '@mantine/hooks';
import AddConnectors from './AddConnectors.tsx';
import EditConnector from './EditConnector.tsx';
import useAPI, { handleError } from '../../hooks/useAPI.ts';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';

export default function Connectors() {
  const { schema, connectors, mutate } = useContext(SchemaContext);
  const theme = useMantineTheme();
  const [opened, { open, close }] = useDisclosure(false);
  const [ editing, setEditing ] = useState<Connector|undefined>(undefined);
  const [ adding, setAdding ] = useState<string|undefined>(undefined);
  const edit = (connector: Connector) => { setAdding(undefined); setEditing(connector); }
  const add = (provider: string) => { close(); setEditing(undefined); setAdding(provider); }
  console.log(schema)

  const { del, request: r1 } = useAPI({
      url: `/schema/${schema?.name}/connector`,
      catch: (e) => handleError(e),
      cleanup: true,
      then: ({connectors, _connectors, headers}) => {
        mutate({connectors, _connectors, headers});
        notifications.show({ title: "Success",message: 'Connector Removed.', color: 'lime', });
      },
  });

  const { post: copy, request: r2 } = useAPI({
      url: `/schema/${schema?.name}/connector`,
      catch: (e) => handleError(e),
      cleanup: true,
      then: ({connectors, _connectors, headers}) => {
        mutate({connectors, _connectors, headers});
        notifications.show({ title: "Success",message: 'Connector Copied.', color: 'lime', });
      },
  });

  const { post: t1, request: r3 } = useAPI({
    url: `/schema/${schema?.name}/connector`,
    catch: (e) => handleError(e),
    cleanup: true,
    then: (name: string) => {
      notifications.show({ title: "Success",message: `${name} connected successfully.`, color: 'lime', });
    },
  });
  const test = (name: string) => t1({append_url: `/${name}/test`, loading: name});

  const remove = (name: string) =>
  modals.openConfirmModal({
      title: 'Permanently Delete Connector',
      centered: true,
      children: (
      <Text size="sm">
          Are you sure you want to delete {name}? This action is destructive and cannot be reversed.
      </Text>
      ),
      labels: { confirm: 'Delete connector', cancel: "No don't delete it" },
      confirmProps: { color: 'red' },
      onConfirm: () => del({append_url: `/${name}`, loading: name}),
  });
  
  const l1 = (n: string) => r1.loading=== n;
  const l2 = (n: string) => r2.loading=== n;
  const l3 = (n: string) => r3.loading=== n;

  if (!schema) return;
  return (
  <Container label={<Head rightSection={<Button onClick={()=>open()} variant="light" >Add</Button>} >Connectors</Head>} >
      <AddConnectors add={add} opened={opened} close={close} />
      <EditConnector editing={editing} adding={adding} close={()=>{setEditing(undefined);setAdding(undefined);}} />
      <Table verticalSpacing="sm">
          <Table.Thead>
          <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Provider</Table.Th>
              <Table.Th />
          </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{ connectors.map((item) => {
            const provider = providers[item.id];
            return (
            <Table.Tr key={item.name}>
              <Table.Td>
                <Group miw={100} gap="sm">
                  <provider.icon color={theme.colors[provider.color][6]} size={20} stroke={1.5} />
                  <Text fz="sm">{item.name}</Text>
                </Group>
              </Table.Td>
              <Table.Td><Badge color={theme.colors[provider.color][6]} variant="light">{provider.name}</Badge></Table.Td>
              <Table.Td miw={80} >
                <Group gap={0} justify="flex-end">
                  <ActionIcon onClick={()=>test(item.name)} loading={l3(item.name)} variant="subtle" color="lime" >
                    <IconTestPipe style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                  </ActionIcon>
                  <ActionIcon onClick={()=>edit(item)} variant="subtle" color="orange">
                    <IconPencil style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                  </ActionIcon>
                  <ActionIcon onClick={()=>copy({append_url: `/${item.name}/copy`, loading: item.name})} loading={l2(item.name)} variant="subtle" color="indigo">
                    <IconCopy style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                  </ActionIcon>
                  <ActionIcon onClick={()=>remove(item.name)} loading={l1(item.name)} variant="subtle" color="red">
                    <IconTrash style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          )})}
          </Table.Tbody>
      </Table>
  </Container>
  )
}
