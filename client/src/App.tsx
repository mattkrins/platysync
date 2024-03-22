import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { AppShell, em,  } from '@mantine/core';
import Navbar from './components/Layout/Navbar'
import Header from './components/Layout/Header';
import { useContext } from 'react';
import AuthContext from './providers/AuthContext';
import CommonContext from './providers/CommonContext';
import { Login } from './components/Auth/Login';
import Settings from './components/Settings/Settings';
import Schema from './components/Schema/Schema';
import Connectors from './components/Connectors/Connectors';
import Rules from './components/Rules/Rules';
import Schedules from './components/Schedules/Schedules';
import Files from './components/Files/Files';

function Switcher(){
  const { nav } = useContext(CommonContext);
  switch (nav) { //LINK - client\src\components\Layout\Navbar.tsx
    //case "Settings": return <Settings/>
    case "Schedules": return <Schedules/>
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
  const { authed } = useContext(AuthContext);
  return ( !authed ? <Login/> :
    <AppShell
      header={{ height: 64, collapsed: !isMobile }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header><Header opened={opened} toggle={toggle} /></AppShell.Header>
      <AppShell.Navbar><Navbar closeNav={close} /></AppShell.Navbar>
      <AppShell.Main><Switcher/></AppShell.Main>
    </AppShell>
  );
}