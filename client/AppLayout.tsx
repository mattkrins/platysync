import { UnstyledButton, AppShell, Group, Burger, Avatar, Select, Text, Loader, Menu } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconAdjustmentsHorizontal, IconCheckbox, IconClock, IconFiles, IconHistory, IconHome, IconLogout, IconPlug, IconSettings, IconUsersGroup } from "@tabler/icons-react";
import { useRoute, useLocation, Redirect, Switch, Route } from "wouter";
import { getCookie } from "./modules/common";
import { useAppSelector, useAppDispatch } from "./providers/hooks";
import { getName, loadSchema } from "./providers/schemaSlice";
import { useEffect } from "react";

import classes from "./App.module.css";

import Home from "./routes/Home/Home";
import Schema from "./routes/Schema/Schema";
import Settings from "./routes/Settings/Settings";
import Users from "./routes/Users/Users";
import Logs from "./routes/Logs/Logs";
import Files from "./routes/Files/Files";

const links = [
    { label: "Home", link: "/home", icon: <IconHome size={15} />, page: Home },
    { label: "Schema", link: "/schema", icon: <IconAdjustmentsHorizontal size={15} />, page: Schema },
    { label: "Files", link: "/files", icon: <IconFiles size={15} />, page: Files },
    { label: "Connectors", link: "/connectors", icon: <IconPlug size={15} />  },
    //REVIEW - potential names:
    // connector, provider, integration, adapter, interface
    // connectors can be a provider or adapter, provider provide data, adapters do not
    { label: "Rules", link: "/rules", icon: <IconCheckbox size={15} /> },
    { label: "Schedules", link: "/schedules", icon: <IconClock size={15} /> },
];

function Link({ link, label, icon }: { link: string, label: string, icon?: JSX.Element }) {
    const [ active ] = useRoute(link);
    const [_, setLocation] = useLocation();
    return <UnstyledButton onClick={()=>setLocation(link)} data-active={active || undefined} className={classes.link}><Group gap="xs">{icon}<Text>{label}</Text></Group></UnstyledButton>
}

function Schemas({}) {
  const [_, setLocation] = useLocation();
  const dispatch = useAppDispatch();
  const { schemas, loadingSchemas } = useAppSelector(state => state.app);
  const name = useAppSelector(getName);
  if (!name) return <Redirect to="/schemas" />;
  useEffect(()=>{ if (name) setLocation("home"); }, [ name ]);
  return (
    <Select ml="xs" leftSection={(loadingSchemas)&&<Loader size={16} />}
    placeholder="Schema"
    value={name}
    data={schemas.map(s=>s.name)}
    onChange={name=>{ if (name) dispatch(loadSchema(name)); } }
    />
  )
}

function User({}) {
  const [_, setLocation] = useLocation();
  const { user: { username } } = useAppSelector(state => state.app);
  return (
  <Menu offset={15} >
    <Menu.Target>
      <UnstyledButton>
        <Group gap="xs">
          <Avatar color="cyan" radius="xl">{username.toUpperCase().slice(0, 2)}</Avatar>
          <Text>{username}</Text>
        </Group>
      </UnstyledButton>
    </Menu.Target>
    <Menu.Dropdown>
      <Menu.Label>Application</Menu.Label>
      <Menu.Item onClick={()=>setLocation("settings")} leftSection={<IconSettings size={14} />} >Settings</Menu.Item>
      <Menu.Item onClick={()=>setLocation("users")} leftSection={<IconUsersGroup size={14} />} >Users</Menu.Item>
      <Menu.Item onClick={()=>setLocation("logs")} leftSection={<IconHistory size={14} />}>Logs</Menu.Item>
      <Menu.Label>User</Menu.Label>
      <Menu.Item onClick={()=>setLocation("logout")} leftSection={<IconLogout size={14} />} >Logout</Menu.Item>
    </Menu.Dropdown>
  </Menu>
  )
}

export function AppLayout() {
  if (!getCookie("auth")) return <Redirect to="/login" />;
  const [opened, { toggle }] = useDisclosure();
  return (
      <AppShell
        header={{ height: 60 }} padding="md"
        navbar={{ width: 300, breakpoint: 'sm', collapsed: { desktop: true, mobile: !opened } }}
      >
        <AppShell.Header>
          <Group h="100%" px="md">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group justify="space-between" style={{ flex: 1 }}>
              <Group ml="xs" gap={0} visibleFrom="sm">
                  <Avatar src="/logo.png" />
                  <Schemas/>
                  <Group ml="sm" gap="xs" visibleFrom="sm">
                      {links.map((link) => <Link key={link.label} {...link} link={link.link} /> )}
                  </Group>
              </Group>
              <Group mr="lg" >
                  <User/>
              </Group>
            </Group>
          </Group>
        </AppShell.Header>
        <AppShell.Navbar py="md" px={4}>
          {links.map((link) => <Link key={link.label} {...link} link={link.link} /> )}
        </AppShell.Navbar>
        <AppShell.Main>
          <Switch>
                <Route path={"/settings"} component={Settings} />
                <Route path={"/users"} component={Users} />
                <Route path={"/logs"} component={Logs} />
                {links.filter(link=>link.page).map(link=><Route key={link.label} path={link.link} component={link.page} />)}
                <Route path="*">
                  {(params) => `404, Sorry the page ${params["*"]} does not exist!`}
                </Route>
          </Switch>
        </AppShell.Main>
      </AppShell>
    );
  }