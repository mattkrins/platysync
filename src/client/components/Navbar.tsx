import { Avatar, Box, Group, SegmentedControl, Title, UnstyledButton, Text, Menu } from '@mantine/core';
import { IconLicense, IconKey, IconUsers, Icon, IconHistory, IconFiles, IconPlug, IconChevronRight, IconAdjustmentsHorizontal, IconList, IconLogout, IconSwitchHorizontal, IconTemplate } from '@tabler/icons-react';
import { useEffect } from 'react';
import { Link, useLocation, useRoute } from 'wouter';
import classes from './Navbar.module.css';
import { useDispatch, useSelector } from '../hooks/redux';
import { getSchemas, getUser, loadSchemas } from '../providers/appSlice';
import VersionBadge from './VersionBadge';
import { getName, loadSchema } from '../providers/schemaSlice';

interface link { link: string, label: string, route: string, icon: Icon }
const tabs: { [k: string]: link[] } = {
    schema: [
        { link: "/dictionary", route: "/app/:schema/dictionary/:*", label: "Dictionary", icon: IconList },
        { link: "/secrets", route: "/app/:schema/secrets/:", label: "Secrets", icon: IconKey },
        { link: "/files", route: "/app/:schema/files/:*", label: "Files", icon: IconFiles },
        { link: "/connectors", route: "/app/:schema/connectors/:*", label: "Connectors", icon: IconPlug },
        { link: "/blueprints", route: "/app/:schema/blueprints/:*", label: "Blueprints", icon: IconTemplate },
        { link: "/rules", route: "/app/:schema/rules/:*", label: "Rules", icon: IconLicense },
        { link: "/schedules", route: "/app/:schema/schedules/:*", label: "Schedule", icon: IconHistory },
    ],
    general: [
        { link: "/settings", route: "/settings", label: "Settings", icon: IconAdjustmentsHorizontal },
        { link: "/users", route: "/users", label: "Users", icon: IconUsers },
        { link: "/logs", route: "/logs", label: "Logs", icon: IconHistory },
        { link: "/dictionary", route: "/dictionary", label: "Dictionary", icon: IconList },
        { link: "/secrets", route: "/secrets", label: "Secrets", icon: IconKey },
    ],
};

interface navLink extends link { section: string }
const NavLink = ( { link, label, route, icon: Icon, section }: navLink) => {
  const activeSchema = useSelector(getName);
  const href = section === "schema" ? `/app/${activeSchema}${link}` : link;
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
  const [_, setLocation] = useLocation();
  const user = useSelector(getUser);
  const schema = useSelector(getName);
  const dispatch = useDispatch();
  const switchSchema = () => { dispatch(loadSchemas()); setLocation('/'); }
  return (
  <Menu position="top" width={270} >
    <Menu.Target>
      <UnstyledButton className={classes.user}>
        <Group>
          <Avatar radius="xl" />
          <div style={{ flex: 1 }}>
            <Text size="sm" fw={500}>{user.username}</Text>
            <Text c="dimmed" size="xs">{schema} schema</Text>
          </div>
          <IconChevronRight size={15} stroke={1.5} />
        </Group>
      </UnstyledButton>
    </Menu.Target>
    <Menu.Dropdown>
      <Menu.Item onClick={()=>setLocation('/logout')} leftSection={<IconLogout size={16} />}>Logout</Menu.Item>
      <Menu.Item onClick={switchSchema} leftSection={<IconSwitchHorizontal size={16} />}>Switch Schema</Menu.Item>
      </Menu.Dropdown>
  </Menu>
  );  
}

export default function Navbar({ params, section, setSection }: { params: Record<string, string>, section: string, setSection(s: string): void }) {
  const links = tabs[section].map((item) => <NavLink key={item.label} {...item} section={section} />);
  const [_, setLocation] = useLocation();
  const dispatch = useDispatch();
  const [isSchemaRoute] = useRoute("/app/:schema/*");
  const schemas = useSelector(getSchemas);
  const activeSchema = useSelector(getName);
  useEffect(()=>{
    if (!activeSchema) {
      if (isSchemaRoute && params.schema && params.schema !== "undefined" ) {
        if (schemas.length > 0) dispatch(loadSchema(params.schema));
      } else {
        setLocation("/");
      }
    }
  },[ activeSchema, schemas ]);
  return (
    <>
      <Box p="md">
         <Box className={classes.header} >
            <Group justify="space-between" align="center" >
              <Group gap={5} align="center" >
                <Avatar src="/logo.png" />
                <Title size="h3" >PlatySync</Title>
              </Group>
              <VersionBadge/>
            </Group>
        </Box>
        <SegmentedControl
          value={section}
          onChange={(value: string) => setSection(value)}
          fullWidth
          data={[{label:"Schema",value:"schema"},{label:"General",value:"general"}]}
        />
      </Box>
      <Box className={classes.navbarMain}>{links}</Box>
      <Box className={classes.footer}><UserButton/></Box>
    </>
  );
}