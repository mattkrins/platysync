import { useMemo, useState } from 'react';
import { Avatar, Box, Code, Group, SegmentedControl, Title } from '@mantine/core';
import {
  IconLicense,
  IconKey,
  IconSettings,
  IconUsers,
  IconLogout,
  IconSwitchHorizontal,
  Icon,
  IconHistory,
  IconFiles,
  IconPlug,
} from '@tabler/icons-react';
import classes from './Navbar.module.css';

const tabs: { [k: string]: { link: string, label: string,icon: Icon }[] } = {
    schema: [
        { link: '', label: 'Schema Settings', icon: IconSettings },
        { link: '', label: 'Files', icon: IconFiles },
        { link: '', label: 'Connectors', icon: IconPlug },
        { link: '', label: 'Rules', icon: IconLicense },
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

export default function Navbar() {
  const [section, setSection] = useState('schema');
  const [active, setActive] = useState('Billing');

  const links = useMemo(()=>tabs[section].map((item) => 
    <a
      className={classes.link}
      data-active={item.label === active || undefined}
      href={item.link}
      key={item.label}
      onClick={(event) => {
        event.preventDefault();
        setActive(item.label);
      }}
    >
      <item.icon className={classes.linkIcon} stroke={1.5} />
      <span>{item.label}</span>
    </a>
  ),[ active, section ]);

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