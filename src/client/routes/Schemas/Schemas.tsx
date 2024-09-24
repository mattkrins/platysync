import { Link, Redirect } from "wouter";
import { useDispatch, useLoader, useSelector } from "../../hooks/redux";
import { getUser, isSetup, loadSchemas } from "../../providers/appSlice";
import { ActionIcon, Card, Center, Container, Group, Image, LoadingOverlay, Menu, Title, Text, Anchor, Modal, Code, Badge } from "@mantine/core";
import { IconDots, IconLogout, IconPlus, IconRefresh, IconSettings } from "@tabler/icons-react";
import classes from './Schemas.module.css';
import { useDisclosure } from "@mantine/hooks";
import Settings from "../Settings/Settings";

function Version({ version }: { version: string }) {
    return <Code>PlatySync v{version}</Code>
  }

export default function Schemas() {
    const [settingsOpen, settingsHandlers] = useDisclosure(false);
    const { setup, schemas, auth: { username }, version } = useSelector(state => state.app);
    const dispatch = useDispatch(); 
    const { loadingSchemas } = useLoader();
    if (!setup) return <Redirect to="/setup" />
    if (!username) return <Redirect to="/login" />
    const open = () => {};
    return (
    <Container mt="3%">
      <Modal styles={{content:{background:"none"}}} withCloseButton={false} size="auto" onClose={settingsHandlers.close} opened={settingsOpen} >
        {settingsOpen&&<Settings/>}
      </Modal>
      <Center><Image src="/logo.png" alt="Logo" h={64} w="auto" /></Center>
      <Title ta="center" pb="md" className={classes.title} >PlatySync</Title>
      <Card withBorder radius="md">
        <LoadingOverlay visible={loadingSchemas} overlayProps={{ radius: "sm", blur: 1 }} />
        <Group justify="space-between">
          <Title size="h3" >Schemas</Title>
          <Menu shadow="md" width={110}>
              <Menu.Target><ActionIcon size="lg" variant="subtle" color="gray"><IconDots/></ActionIcon></Menu.Target>
              <Menu.Dropdown>
                  <Menu.Item onClick={open} leftSection={<IconPlus size={16}/>}>New</Menu.Item>
                  <Menu.Item onClick={()=>dispatch(loadSchemas())} leftSection={<IconRefresh size={16}/>}>Refresh</Menu.Item>
              </Menu.Dropdown>
          </Menu>
        </Group>
        {schemas.length<=0&&<Text c="dimmed" >No schemas configured. <Anchor onClick={open} >Create</Anchor> a new schema to begin.</Text>}
      </Card>
      <Group justify="space-between" m="xs" >
        <Group gap={5}>
            <ActionIcon component={Link} href='/logout' size="xs" variant="subtle" color="gray"><IconLogout/></ActionIcon>
            <Anchor className={classes.hightlight} component={Link} href='/logout' size="xs">Logout ({username})</Anchor>
        </Group>
        <Group gap={5} ><Version version={version} /><ActionIcon onClick={settingsHandlers.open} size="xs" variant="subtle" color="gray"><IconSettings/></ActionIcon></Group>
      </Group>
    </Container>
    )
}
