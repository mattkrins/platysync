import { UnstyledButton, AppShell, Group, Burger, Avatar, Select, ActionIcon, Text, Loader, Menu, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconAdjustmentsHorizontal, IconCheckbox, IconClock, IconDots, IconFiles, IconHistory, IconHome, IconLogout, IconPlug, IconSettings, IconUser, IconUsersGroup } from "@tabler/icons-react";
import { useContext } from "react";
import { useRoute, useLocation, Redirect, Switch, Route } from "wouter";
import { getCookie } from "./modules/common";
import AppContext from "./providers/AppContext";

import classes from "./App.module.css";
import SchemaContext from "./providers/SchemaContext";
import Home from "./routes/Home/Home";
import Schema from "./routes/Schema/Schema";
import Settings from "./routes/Settings/Settings";
import Users from "./routes/Users/Users";
import Logs from "./routes/Logs/Logs";

const links = [
    { label: "Home", link: "/home", icon: <IconHome size={15} />, page: Home },
    { label: "Schema", link: "/schema", icon: <IconAdjustmentsHorizontal size={15} />, page: Schema },
    { label: "Files", link: "/files", icon: <IconFiles size={15} /> },
    { label: "Connectors", link: "/connectors", icon: <IconPlug size={15} />  },
    //REVIEW - potential names:
    // connector, provider, integration, adapter, interface
    { label: "Rules", link: "/rules", icon: <IconCheckbox size={15} /> },
    { label: "Schedules", link: "/schedules", icon: <IconClock size={15} /> },
];

function Link({ link, label, icon }: { link: string, label: string, icon?: JSX.Element }) {
    const [ active ] = useRoute(link);
    const [_, setLocation] = useLocation();
    return <UnstyledButton onClick={()=>setLocation(link)} data-active={active || undefined} className={classes.link}><Group gap="xs">{icon}<Text>{label}</Text></Group></UnstyledButton>
}

export function AppLayout() {
  if (!getCookie("auth")) return <Redirect to="/login" />;
  const { schemas, loadingSchemas, username } = useContext(AppContext);
  const { getSchema, loadingSchema, name } = useContext(SchemaContext);
  if (!loadingSchema && !name) return <Redirect to="/" />;
  const [_, setLocation] = useLocation();
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
                  <Select ml="xs" leftSection={(loadingSchema||loadingSchemas)&&<Loader size={16} />}
                  placeholder="Schema"
                  value={name}
                  data={schemas.map(s=>s.name)}
                  onChange={name=>{ if (name) getSchema(name); } }
                  />
                  <Group ml="sm" gap="xs" visibleFrom="sm">
                      {links.map(link => <Link key={link.label} {...link} /> )}
                  </Group>
              </Group>
              <Group mr="lg" >
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
              </Group>
            </Group>
          </Group>
        </AppShell.Header>
        <AppShell.Navbar py="md" px={4}>
          {links.map((link) => <Link key={link.label} {...link} /> )}
        </AppShell.Navbar>
        <AppShell.Main>
          <Switch>
                {links.filter(link=>link.page).map(link=><Route key={link.label} path={link.link} component={link.page} />)}
                <Route path={"/settings"} component={Settings} />
                <Route path={"/users"} component={Users} />
                <Route path={"/logs"} component={Logs} />
              <Route>Unknown Route</Route>
          </Switch>
        </AppShell.Main>
      </AppShell>
    );
  }