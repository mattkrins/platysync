import { Card,  Text,  SimpleGrid,  UnstyledButton,  Anchor,  Group,  Container,  Title,  ActionIcon,  Menu,  Grid,  Code, Modal, LoadingOverlay, Tooltip } from '@mantine/core';
import { IconDotsVertical, IconPlus, IconTrash, IconPackageExport, IconGridDots, IconPackageImport, IconRefresh } from '@tabler/icons-react';
import classes from './Setup/Setup.module.css';
import { useEffect, useState } from 'react';
import { modals } from '@mantine/modals';
import useAPI from '../hooks/useAPI';
import { Link, Redirect, useLocation } from 'wouter';
import { checkForUpdate, compareVersion, getCookie } from '../modules/common';
import { useDisclosure } from '@mantine/hooks';
import NewSchema from '../components/NewSchema';
import Exporter from '../components/Exporter';
import Importer from '../components/Importer';
import { useAppDispatch, useAppSelector } from '../providers/hooks';
import { loadApp, loadSchemas, loadUser } from '../providers/appSlice';
import { loadSchema } from '../providers/schemaSlice';

function Schema({ schema, exportSchema }: { schema: Schema, exportSchema(schema: Schema): void }) {
  if (!getCookie("setup")) return <Redirect to="/setup" />;
  if (!getCookie("auth")) return <Redirect to="/login" />;
  const [_, setLocation] = useLocation();
  const dispatch = useAppDispatch();
  const { del, loading: deleting } = useAPI({
    url: "/api/v1/schema", data: { name: schema.name },
    finally: () => dispatch(loadSchemas())
  }); 
  const deleteSchema = () =>
    modals.openConfirmModal({
      title: 'Delete Schema',
      children: <Text size="sm">Are you sure you want to delete <b>{schema.name}</b>?<br/>This action is destructive and cannot be reversed.</Text>,
      labels: { confirm: 'Delete schema', cancel: "Cancel" },
      confirmProps: { color: 'red' },
      onConfirm: () => del(),
  });
  const loading = deleting;
  const openSchema = () => { if (loading) return; dispatch(loadSchema(schema.name)).then(()=>setLocation("home")); }
  return (
    <Card shadow="sm" radius="md" withBorder className={classes.item} >
        <Grid align="center" gutter={0}>
            <Grid.Col span={11}><UnstyledButton onClick={openSchema} m={0} w="100%">{schema.name}</UnstyledButton></Grid.Col>
            <Grid.Col span={1}>
                <Group justify="flex-end">
                    <Menu shadow="md" width={100} withArrow>
                        <Menu.Target><ActionIcon loading={loading} size="lg" variant="subtle" color="gray"><IconDotsVertical/></ActionIcon></Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item onClick={openSchema} leftSection={<IconGridDots size={15}/>}>Open</Menu.Item>
                            <Menu.Item onClick={()=>exportSchema(schema)} leftSection={<IconPackageExport size={15}/>}>Export</Menu.Item>
                            <Menu.Item onClick={deleteSchema} leftSection={<IconTrash size={15}/>} color='red'>Delete</Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            </Grid.Col>
        </Grid>
    </Card>
  )
}

function Version({ version }: { version: string }) {
  const [newVersion, setAvailable] = useState<string|undefined>(undefined);
  const ver = compareVersion(newVersion||"0", version||"0");
  const color = ver > 2 ? "red" : ver > 0 ? "orange" : undefined;
  useEffect(()=>{
    checkForUpdate().then(newVersion=>{
      if ( compareVersion(newVersion, version) > 0 ) setAvailable(newVersion);
    });
  }, []);
  return newVersion ?
  <Tooltip withArrow position="left" label={`New version ${newVersion} available.`} >
    <Code color={color} style={{cursor:"help"}} >!PlatySync v{version}</Code>
  </Tooltip> : <Code>PlatySync v{version}</Code>
}

export default function Schemas() {
  const { schemas, user: { username }, loadingSchemas, version } = useAppSelector(state => state.app);
  const dispatch = useAppDispatch();
  useEffect(()=>{
    dispatch(loadApp());
    dispatch(loadSchemas());
    dispatch(loadUser());
  }, []);
  const [opened, { open, close }] = useDisclosure(false);
  const [importing, { open: openImporter, close: closeImporter }] = useDisclosure(false);
  const [exporting, setExporting] = useState<Schema|undefined>(undefined);
  const [defaultImport, setImporting] = useState<Schema|undefined>(undefined);
  const onImport = (schema: Schema) => { setImporting(schema); closeImporter(); open(); };
  return (
    <Container mt="10%">
      <Importer title="Import Schema" opened={importing} close={closeImporter} onImport={onImport} onError={()=>setImporting(undefined)} json accept={['application/json']} />
      <Exporter title="Export Schema" filename={exporting?`${exporting.name}.json`:''} data={exporting?JSON.stringify(exporting, null, 2):''} json close={()=>setExporting(undefined)} />
      <Modal opened={opened} onClose={close} title="New Schema">
        <NewSchema then={()=>close()} defaultImport={defaultImport}  />
      </Modal>
      <Card withBorder radius="md" className={classes.card}>
        <LoadingOverlay visible={loadingSchemas} overlayProps={{ radius: "sm", blur: 1 }} />
        <Group justify="space-between">
          <Title size="h2" >Schemas</Title>
          <Menu shadow="md" width={110}>
              <Menu.Target><ActionIcon size="lg" variant="subtle" color="gray"><IconPlus/></ActionIcon></Menu.Target>
              <Menu.Dropdown>
                  <Menu.Item onClick={open} leftSection={<IconPlus size={15}/>}>New</Menu.Item>
                  <Menu.Item onClick={openImporter} leftSection={<IconPackageImport size={15}/>}>Import</Menu.Item>
                  <Menu.Item onClick={()=>dispatch(loadSchemas())} leftSection={<IconRefresh size={15}/>}>Refresh</Menu.Item>
              </Menu.Dropdown>
          </Menu>
        </Group>
        <SimpleGrid cols={1} mt="md">{schemas.map((schema)=>(<Schema schema={schema} key={schema.name} exportSchema={setExporting} />))}</SimpleGrid>
        {schemas.length<=0&&<Text c="dimmed" >No schemas configured. <Anchor >Create</Anchor> a new schema to begin.</Text>}
      </Card>
      <Group justify="space-between" m="xs" >
        <Anchor component={Link} href='/logout' size="xs">Logout ({username})</Anchor>
        <Version version={version} />
      </Group>
    </Container>
  );
}