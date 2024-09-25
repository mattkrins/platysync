import { Avatar, Box, Group, SegmentedControl, Title, UnstyledButton, Text, Badge, Menu, Loader, Tooltip } from '@mantine/core';
import { IconLicense, IconKey, IconSettings, IconUsers, Icon, IconHistory, IconFiles, IconPlug, IconChevronRight, IconChevronDown, IconQuotes, IconBlockquote, IconAdjustmentsHorizontal, IconList, IconRefresh } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams, useRoute } from 'wouter';
import classes from './Navbar.module.css';
import { useDispatch, useLoader, useSelector } from '../hooks/redux';
import { checkVersion, getActive, getLatestVersion, getVersion, setActive } from '../providers/appSlice';
import { checkForUpdate, compareVersion } from '../modules/common';
import VersionBadge from './VersionBadge';

interface link { link: string, label: string, route: string, icon: Icon }
const tabs: { [k: string]: link[] } = {
    schema: [
        { link: "/dictionary", route: "/app/:schema/dictionary/:*", label: "Dictionary", icon: IconList },
        { link: "/files", route: "/app/:schema/files/:*", label: "Files", icon: IconFiles },
        { link: "/connectors", route: "/app/:schema/connectors/:*", label: "Connectors", icon: IconPlug },
        { link: "/rules", route: "/app/:schema/rules/:*", label: "Rules", icon: IconLicense },
    ],
    general: [
        { link: "/settings", route: "/settings", label: "Settings", icon: IconAdjustmentsHorizontal },
        { link: "/dictionary", route: "/app/:schema/dictionary/:*", label: "Dictionary", icon: IconList },
        { link: "/secrets", route: "/secrets", label: "Secrets", icon: IconKey },
        { link: "/users", route: "/users", label: "Users", icon: IconUsers },
        { link: "/logs", route: "/logs", label: "Logs", icon: IconHistory },
    ],
};

interface navLink extends link { params: Record<string, string>, section: string }
const NavLink = ( { link, label, route, icon: Icon, section, params }: navLink) => {
  const activeSchema = useSelector(getActive);
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

export default function Navbar({ params, section, setSection }: { params: Record<string, string>, section: string, setSection(s: string): void }) {
  const links = tabs[section].map((item) => <NavLink key={item.label} {...item} params={params} section={section} />);
  const [_, setLocation] = useLocation();
  const dispatch = useDispatch();
  const [isSchemaRoute] = useRoute("/app/:schema/*");
  const activeSchema = useSelector(getActive);
  useEffect(()=>{
    if (!activeSchema) {
      if (isSchemaRoute && params.schema && params.schema !== "undefined" ) {
        dispatch(setActive(params.schema))
      } else {
        setLocation("/");
      }
    }
  },[ activeSchema ]);
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