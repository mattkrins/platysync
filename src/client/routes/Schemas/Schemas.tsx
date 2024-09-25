import { Link, Redirect, useLocation } from "wouter";
import { useDispatch, useLoader, useSelector } from "../../hooks/redux";
import { loadSchemas, setActive } from "../../providers/appSlice";
import { ActionIcon, Card, Center, Container, Group, Image, LoadingOverlay, Menu, Title, Text, Anchor, Modal, SimpleGrid, Grid, UnstyledButton } from "@mantine/core";
import { IconDots, IconDotsVertical, IconEdit, IconGridDots, IconLogout, IconPackageExport, IconPackageImport, IconPlus, IconRefresh, IconSettings, IconTrash } from "@tabler/icons-react";
import classes from './Schemas.module.css';
import { useDisclosure } from "@mantine/hooks";
import Settings from "../Settings/Settings";
import { modals } from "@mantine/modals";
import useAPI from "../../hooks/useAPI";
import Exporter from "../../components/Exporter";
import { useState } from "react";
import useEditor from "../../hooks/useEditor";
import Editor from "./Editor";
import { initialState } from "../../providers/schemaSlice";
import VersionBadge from "../../components/VersionBadge";

function Schema({ schema, exportSchema, edit }: { schema: Schema, exportSchema(schema: Schema): void, edit(): void }) {
  const [_, setLocation] = useLocation();
  const dispatch = useDispatch();
  const { del, loading } = useAPI({
    url: "/schema", data: { name: schema.name },
    finally: () => dispatch(loadSchemas())
  }); 
  const openSchema = () => {
    dispatch(setActive(schema.name));
    setLocation(`/app/${schema.name}/dictionary`);
  }
  const deleteSchema = () =>
    modals.openConfirmModal({
      title: 'Delete Schema',
      children: <Text size="sm">Are you sure you want to delete <b>{schema.name}</b>?<br/>This action is destructive and cannot be reversed.</Text>,
      labels: { confirm: 'Delete schema', cancel: "Cancel" },
      confirmProps: { color: 'red' },
      onConfirm: () => del(),
  });
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
                            <Menu.Item onClick={edit} leftSection={<IconEdit size={15}/>}>Edit</Menu.Item>
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

export default function Schemas() {
    const [settingsOpen, settingsHandlers] = useDisclosure(false);
    const [ schema, editing, { add, close, edit } ] =  useEditor<Schema>(initialState);
    const { setup, schemas, auth: { username } } = useSelector(state => state.app);
    const dispatch = useDispatch();
    const { loadingSchemas } = useLoader();
    const [exporting, setExporting] = useState<Schema|undefined>(undefined);
    if (!setup) return <Redirect to="/setup" />;
    if (!username) return <Redirect to="/login" />;
    return (
    <Container mt="3%">
      <Editor open={schema} adding={!editing} close={close} />
      <Exporter title="Export Schema" filename={exporting?`${exporting.name}.json`:''} data={exporting?JSON.stringify(exporting, null, 2):''} json close={()=>setExporting(undefined)} />
      <Modal styles={{content:{background:"none"}}} withCloseButton={false} size="auto" onClose={settingsHandlers.close} opened={settingsOpen} >
        {settingsOpen&&<Settings/>}
      </Modal>
      <Center pb="xs"><Image src="/logo.png" alt="Logo" h={64} w="auto" /></Center>
      <Title ta="center" pb="xl" className={classes.title} >PlatySync</Title>
      <Card withBorder radius="md">
        <LoadingOverlay visible={loadingSchemas} overlayProps={{ radius: "sm", blur: 1 }} />
        <Group justify="space-between">
          <Title size="h3" >Schema Manager</Title>
          <Menu shadow="md" width={110}>
              <Menu.Target><ActionIcon size="lg" variant="subtle" color="gray"><IconDots/></ActionIcon></Menu.Target>
              <Menu.Dropdown>
                  <Menu.Item onClick={()=>add()} leftSection={<IconPlus size={16}/>}>New</Menu.Item>
                  <Menu.Item onClick={()=>add()} leftSection={<IconPackageImport size={15}/>}>Import</Menu.Item>
                  <Menu.Item onClick={()=>dispatch(loadSchemas())} leftSection={<IconRefresh size={16}/>}>Refresh</Menu.Item>
              </Menu.Dropdown>
          </Menu>
        </Group>
        <SimpleGrid verticalSpacing="xs" cols={1} mt="xs">{schemas.map((schema)=>(<Schema schema={schema} key={schema.name} exportSchema={setExporting} edit={()=>edit(schema)} />))}</SimpleGrid>
        {schemas.length<=0&&<Text c="dimmed" >No schemas configured. <Anchor onClick={()=>add()} >Create</Anchor> a new schema to begin.</Text>}
      </Card>
      <Group justify="space-between" m="xs" >
        <Group gap={5}>
            <ActionIcon component={Link} href='/logout' size="xs" variant="subtle" color="gray"><IconLogout/></ActionIcon>
            <Anchor className={classes.hightlight} component={Link} href='/logout' size="xs">Logout ({username})</Anchor>
        </Group>
        <Group gap={5} ><VersionBadge/><ActionIcon onClick={settingsHandlers.open} size="xs" variant="subtle" color="gray"><IconSettings/></ActionIcon></Group>
      </Group>
    </Container>
    )
}
