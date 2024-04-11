import { Text, Group, ActionIcon, Tooltip, rem, Button, em, Box, Center, Paper, RingProgress, UnstyledButton, Menu, Modal, Loader, } from '@mantine/core';
import { IconPlus, IconAdjustmentsHorizontal, TablerIconsProps, IconCheckbox, IconSettings, IconLogout, IconX, IconPlug, IconClock, IconChevronRight, IconUser, IconRun, IconSearch, IconClockPause, IconFiles } from '@tabler/icons-react';
import classes from './Navbar.module.css';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import Header from './Header';
import { useContext, useEffect } from 'react';
import useAPI from '../../hooks/useAPI';
import SchemaContext from '../../providers/SchemaContext2';
import NewSchema from './NewSchema';
import AppContext from '../../providers/AppContext';
import useSocket from '../../hooks/useSocket';
import Status from '../Rules/Run/Status';

//LINK - client\src\App.tsx:15

const commonLinks = [
  { icon: IconAdjustmentsHorizontal, label: 'Settings' },
  { icon: IconClock, label: 'Schedules' },
  { icon: IconUser, label: 'Users' },
];

const schemaLinks = [
  { icon: IconSettings, label: 'Schema' },
  { icon: IconFiles, label: 'Files' },
  { icon: IconPlug, label: 'Connectors' },
  { icon: IconCheckbox, label: 'Rules' },
];

interface Link {
  icon(props: TablerIconsProps): JSX.Element;
  label: string;
}
function Link( { link, active, onClick }: { link: Link, active?: boolean, onClick?(): void } ) {
  return <Button data-active={active || undefined} fullWidth variant="subtle" size="xs"
  leftSection={<link.icon size={20} stroke={1.5} />}
  styles={{ inner: { justifyContent: 'start' }, label: { fontWeight: 400 } }}
  classNames={{ root: classes.link }}
  onClick={onClick}
  >{link.label}</Button>
}

export default function Navbar({ closeNav }: { closeNav(): void }) {
  const { logout, username, version, nav, changeNav } = useContext(AppContext);
  const {loadSchema, loading, loaders, ...schema} = useContext(SchemaContext);
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`);
  const [opened, { open, close }] = useDisclosure(false);
  const [showingStatus, { open: showStatus, close: closeStatus }] = useDisclosure(false);

  const { data: schemas = [], loading: creating, fetch: refresh } = useAPI({
      url: "/schema",
      default: [],
      preserve: true,
      fetch: true,
      mutate: (schemas: Schema[]) => schemas.map(s=>({label: s.name})),
  });

  useEffect(()=>{ refresh(); },[ schema.name ]);

  const navigate = (link: string) =>{ changeNav(link); if (isMobile) { closeNav(); } }

  const [ global_status ]: [ { schema?: string,  rule?: string, running?: boolean } ] = useSocket('global_status', {
    default: {}
  } );
  const [ progress ]: [ { p: number } ] = useSocket('progress', {
      default: { p: 0 }
  } );
  useEffect(()=>{ if (!global_status.schema) closeStatus() }, [ global_status.schema ])

  return (
    <nav className={classes.navbar}>
      {global_status.schema&&<Modal withCloseButton={false} size="xl" opened={showingStatus} onClose={closeStatus}
      styles={{body:{padding: 0}, content:{backgroundColor: "transparent"}}}
      >
        <Center><Status resultant={false} /></Center>
      </Modal>}
      {opened&&<NewSchema opened={opened} close={close} refresh={refresh} />}
      {!isMobile&&<Box className={`${classes.section} ${classes.header}`} ><Header version={version} /></Box>}
      <Box pt="xs" className={classes.section}>
        <Box className={classes.links}>
          {commonLinks.map((link) => <Link key={link.label} onClick={()=>navigate(link.label)} active={nav===link.label} link={link} />)}
        </Box>
      </Box>
      {schema.valid&&<Box pt="xs" className={classes.section}>
        <Box className={classes.links}>
          {schemaLinks.map((link) => <Link key={link.label} onClick={()=>navigate(link.label)} active={nav===link.label} link={link} />)}
        </Box>
      </Box>}
      <Box style={{flex: 1}} className={classes.section}>
        <Group className={classes.collectionsHeader} justify="space-between">
          <Text size="xs" fw={500} c="dimmed">Schemas</Text>
          <Tooltip label="Create schema" withArrow position="right">
            <ActionIcon onClick={open} loading={creating} variant="default" size={18}>
              <IconPlus style={{ width: rem(12), height: rem(12) }} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        </Group>
        <Box className={classes.links}>
          {schemas.map((link) => {
            const active = (schema.name)===link.label;
            return (
            <Button key={link.label} fullWidth variant="subtle" size="xs"
            styles={{ inner: { justifyContent: 'space-between' }, label: { fontWeight: 400 } }}
            classNames={{ root: classes.link }}
            onClick={()=>active?undefined:loadSchema(link.label)}
            loading={loaders[link.label]}
            disabled={loading}
            rightSection={active?<IconX onClick={()=>loadSchema(undefined)} style={{ width: rem(12), height: rem(12), cursor: 'pointer' }} stroke={1.5} />:undefined}
            data-active={active?true:undefined}
            >{link.label}</Button>
          )})}
        </Box>
      </Box>
      <Box>
        <Paper withBorder radius="md" mb="xs" pb={0} >
          <UnstyledButton style={{cursor:global_status.schema?'pointer':'auto'}}  disabled={!global_status.schema} onClick={showStatus} className={classes.user} p="xs" >
          <Group>
            {global_status.schema?
              <RingProgress
              size={50}
              roundCaps
              thickness={3}
              sections={[{ value: progress.p, color: 'blue' }]}
              label={
                <Center>
                  {global_status.running?
                  <IconRun style={{ width: rem(20), height: rem(20) }} stroke={1.5} />:
                  <IconSearch style={{ width: rem(20), height: rem(20) }} stroke={1.5} />}
                </Center>
              }
            />:
            <IconClockPause style={{ width: rem(50), height: rem(50) }} stroke={0.5} />}
            <div>
              <Text size="sm" tt="uppercase" >Status:</Text>
              {!global_status.schema?<Text c="dimmed" size="xs">Idle</Text>:<>
                <Text c="dimmed" size="xs">{global_status.running?'Running Actions...':'Finding Matches...'}</Text>
                <Text c="dimmed" size="xs">Schema: {global_status.schema}</Text>
                <Text c="dimmed" size="xs">Rule: {global_status.rule}</Text>
              </>}
            </div>
          </Group>
          </UnstyledButton>
        </Paper>
      </Box>
    <Box>
      <Paper radius="md" withBorder p={0} bg="var(--mantine-color-body)">
        <Menu position="top-start" width="target" >
          <Menu.Target>
            <UnstyledButton className={classes.user}>
              <Group>
                <IconUser style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
                <div style={{ flex: 1 }}>
                  {!username?<Loader size="xs" type="dots" />:<Text size="sm" fw={500}>{username}</Text>}
                  <Text c="dimmed" size="xs">administrator</Text>
                </div>
                <IconChevronRight style={{ width: rem(14), height: rem(14) }} stroke={1.5} />
              </Group>
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={logout} leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}>Logout</Menu.Item>
            </Menu.Dropdown>
        </Menu>
      </Paper>
    </Box>
    </nav>
  );
}