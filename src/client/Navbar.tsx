import { useMemo, useState } from 'react';
import { Avatar, Box, Code, Group, SegmentedControl, Title } from '@mantine/core';
import { IconLicense, IconKey, IconSettings, IconUsers, IconLogout, IconSwitchHorizontal, Icon, IconHistory, IconFiles, IconPlug } from '@tabler/icons-react';
import classes from './Navbar.module.css';
import { Link, useLocation, useRoute } from 'wouter';

const tabs: { [k: string]: { link: string, label: string,icon: Icon }[] } = {
    schema: [
        { link: '/schema', label: 'Schema Settings', icon: IconSettings },
        { link: '/files', label: 'Files', icon: IconFiles },
        { link: '/connectors', label: 'Connectors', icon: IconPlug },
        { link: '/rules', label: 'Rules', icon: IconLicense },
    ],
    general: [
        { link: '', label: 'General Settings', icon: IconSettings },
        { link: '', label: 'Secrets', icon: IconKey },
        { link: '', label: 'Users', icon: IconUsers },
        { link: '', label: 'Logs', icon: IconHistory },
    ],
};
const tabData = Object.keys(tabs).map(value=>({ label: value.charAt(0).toUpperCase()+value.slice(1), value }))

function Header({}) {
    return (
        <Box className={classes.header}>
            <Group justify="space-between" align="center" >
                <Group gap={5} align="center" >
                    <Avatar src="/logo.png" />
                    <Title size="h3" >PlatySync</Title>
                </Group>
            <Code fw={700}>v3.1.2</Code>
            </Group>
        </Box>
    )
}

const CustomLink = ( { href, item, ...props }:
  {
    href: string,
    item: { link: string; label: string; icon: Icon; }
  }) => {
  const [isActive, x] = useRoute(href);
  const [location, navigate] = useLocation();

  return (
    <Link href={href} {...props} asChild>
      <a 
      className={classes.link}
      data-active={isActive}
      href={item.link}
      key={item.label}
      >
        <item.icon className={classes.linkIcon} stroke={1.5} />
        <span>{item.label}</span>
      </a>
    </Link>
  );
};

export default function Navbar() {
  const [section, setSection] = useState('schema');
  const [active, setActive] = useState('Billing');

  const links = tabs[section].map((item) => {
    return <CustomLink key={item.label} item={item} href={item.link} />;
  })


  return (
    <>
      <Box>
        <Header/>
        <SegmentedControl
          value={section}
          onChange={(value: any) => setSection(value)}
          transitionTimingFunction="ease"
          fullWidth
          data={tabData}
        />
      </Box>
      <Box className={classes.navbarMain}>{links}</Box>
      <div className={classes.footer}>
        <a href="#" className={classes.link} onClick={(event) => event.preventDefault()}>
          <IconSwitchHorizontal className={classes.linkIcon} stroke={1.5} />
          <span>Change schema</span>
        </a>

        <a href="#" className={classes.link} onClick={(event) => event.preventDefault()}>
          <IconLogout className={classes.linkIcon} stroke={1.5} />
          <span>Logout</span>
        </a>
      </div>
    </>
  );
}