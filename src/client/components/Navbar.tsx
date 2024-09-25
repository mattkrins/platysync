import { Avatar, Box, Group, SegmentedControl, Title, UnstyledButton, Text, Badge, Menu } from '@mantine/core';
import { IconLicense, IconKey, IconSettings, IconUsers, Icon, IconHistory, IconFiles, IconPlug, IconChevronRight, IconChevronDown } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, useParams, useRoute } from 'wouter';
import classes from './Navbar.module.css';

interface link { link: string, label: string, route: string, icon: Icon }
const tabs: { [k: string]: link[] } = {
    schema: [
        { link: "/schema", route: "/app/:schema/schema", label: "Schema Settings", icon: IconSettings },
        { link: "/files", route: "/app/:schema/files/:*", label: "Files", icon: IconFiles },
        { link: "/connectors", route: "/app/:schema/connectors/:*", label: "Connectors", icon: IconPlug },
        { link: "/rules", route: "/app/:schema/rules/:*", label: "Rules", icon: IconLicense },
    ],
    general: [
        { link: "/settings", route: "/settings", label: "General Settings", icon: IconSettings },
        { link: "/secrets", route: "/secrets", label: "Secrets", icon: IconKey },
        { link: "/users", route: "/users", label: "Users", icon: IconUsers },
        { link: "/logs", route: "/logs", label: "Logs", icon: IconHistory },
    ],
};

interface navLink extends link { params: Record<string, string>, section: string }
const NavLink = ( { link, label, route, icon: Icon, section, params }: navLink) => {
  const href = section === "schema" ? `/app/${params.schema}${link}` : link;
  const [linkActive] = useRoute(href);
  const [routeActive] = useRoute(route);
  return (
    <Link href={href} asChild>
      <a className={`${classes.link} ${(linkActive||routeActive)?classes.active:''}`} >
        <Icon className={classes.linkIcon} stroke={1.5} />
        <span>{label}</span>
      </a>
    </Link>
  );
};

function UserButton() {
  return (
    <UnstyledButton className={classes.user}>
      <Group>
        <Avatar radius="xl" />
        <div style={{ flex: 1 }}>
          <Text size="sm" fw={500}>Harriette Spoonlicker</Text>
          <Text c="dimmed" size="xs">hspoonlicker@outlook.com</Text>
        </div>
        <IconChevronRight size={15} stroke={1.5} />
      </Group>
    </UnstyledButton>
  );
}

function Version() {
  return (
    <Menu shadow="md" width={100}>
      <Menu.Target>
        <Badge style={{cursor:"pointer"}} variant="dot" color='lime.4' tt="lowercase"><Group gap={6} >v0.6.0 <IconChevronDown size={10} /></Group></Badge>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Application</Menu.Label>
        <Menu.Item>Test</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

export default function Navbar({ params }: { params: Record<string, string> }) {
  const [section, setSection] = useState('schema');
  const links = tabs[section].map((item) => <NavLink key={item.label} {...item} params={params} section={section} />);
  return (
    <>
      <Box p="md">
         <Box className={classes.header} >
            <Group justify="space-between" align="center" >
              <Group gap={5} align="center" >
                <Avatar src="/logo.png" />
                <Title size="h3" >PlatySync</Title>
              </Group>
              <Version/>
            </Group>
        </Box>
        <SegmentedControl
          value={section}
          onChange={(value: any) => setSection(value)}
          fullWidth
          data={[{label:"Schema",value:"schema"},{label:"General",value:"general"}]}
        />
      </Box>
      <Box className={classes.navbarMain}>{links}</Box>
      <Box className={classes.footer}><UserButton/></Box>
    </>
  );
}