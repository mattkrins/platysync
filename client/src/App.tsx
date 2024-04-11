import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { AppShell, em,  } from '@mantine/core';
import Navbar from './components/Layout/Navbar'
import Header from './components/Layout/Header';
import { useContext } from 'react';
import AppContext from './providers/AppContext';
import { Login } from './components/Auth/Login';
import Settings from './components/Settings/Settings';
import Schema from './components/Schema/Schema';
import Connectors from './components/Connectors/Connectors';
import Rules from './components/Rules/Rules';
import Schedules from './components/Schedules/Schedules';
import Files from './components/Files/Files';
import Users from './components/Users/Users';

function Switcher(){
  const { nav } = useContext(AppContext);
  switch (nav) { //LINK - client\src\components\Layout\Navbar.tsx:15
    case "Schedules": return <Schedules/>
    case "Users": return <Users/>
    case "Files": return <Files/>
    case "Schema": return <Schema/>
    case "Connectors": return <Connectors/>
    case "Rules": return <Rules/>
    default: return <Settings/>
  }
}

export default function App() {
  const [opened, { toggle, close }] = useDisclosure();
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`);
  const { session, version } = useContext(AppContext);
  return ( !session ? <Login/> :
    <AppShell
      header={{ height: 64, collapsed: !isMobile }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header><Header opened={opened} toggle={toggle} version={version} /></AppShell.Header>
      <AppShell.Navbar><Navbar closeNav={close} /></AppShell.Navbar>
      <AppShell.Main><Switcher/></AppShell.Main>
    </AppShell>
  );
}