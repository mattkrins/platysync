import { createTheme, MantineProvider, PasswordInput, Select, TextInput, Textarea, MultiSelect } from "@mantine/core";
import { ModalsProvider } from '@mantine/modals';
import { Link, Route, Switch, useLocation } from "wouter";
import { Provider as Redux } from 'react-redux';

import "@mantine/core/styles.css";
import '@mantine/dates/styles.css';
import themeClasses from "./theme.module.css";

import Setup from "./routes/Setup/Setup";
import Schemas from "./routes/Schemas";
import Login from "./routes/Auth/Login";
import Logout from "./routes/Auth/Logout";
import { AppLayout } from "./AppLayout";
import store from "./providers/store";
import { useDispatch, useSelector } from "./hooks/redux";
import { isSetup, loadApp, loadSettings } from "./providers/appSlice";
import { useEffect } from "react";
import AppShell from "./AppShell";

const inputTheme = {
  classNames: {
    input: themeClasses.input,
  },
};

const theme = createTheme({
  fontFamily: 'Roboto, sans-serif',
  components: {
      TextInput: TextInput.extend(inputTheme),
      PasswordInput: PasswordInput.extend(inputTheme),
      Select: Select.extend(inputTheme),
      Textarea: Textarea.extend(inputTheme),
      NumberInput: Textarea.extend(inputTheme),
      JsonInput: Textarea.extend(inputTheme),
      Autocomplete: Textarea.extend(inputTheme),
      MultiSelect: MultiSelect.extend({ classNames: { pill: themeClasses.pill, ...inputTheme.classNames } }),
  },
});

function Router2() {
    const dispatch = useDispatch();
    const setup = useSelector(isSetup);
    const [_, setLocation] = useLocation();
    useEffect(()=>{
      dispatch(loadApp()).then(setup=> setup ? null : setLocation(`/setup`))
      .then(()=>dispatch(loadSettings()));
    }, []);
    return (
    <Switch>
        <Route path="/login" component={Login} />
        <Route path="/logout" component={Logout} />
        {!setup&&<Route path="/setup" component={Setup} />}
        {!setup&&<Route path="/setup/:step" component={Setup} />}
        <Route path="/schemas" component={Schemas} />
        <Route><AppLayout/></Route>
    </Switch>
    )
}

function InboxPage({}) {
  return <>TEST</>
}

function Router() {
    return <AppShell/>
    return (
    <>
      <Link href="/users/1">Profile</Link>
      <Route path="/about">About Us</Route>
      <Switch>
        <Route path="/" component={InboxPage} />
        <Route path="/users/:name">
          {(params) => <>Hello, {params.name}!</>}
        </Route>
        <Route>404: No such page!</Route>
      </Switch>
    </>
    )
}

export default function App() {
    return (
        <MantineProvider defaultColorScheme="auto" theme={theme}>
            <ModalsProvider>    
                <Redux store={store}>
                    <Router/>
                </Redux>
            </ModalsProvider>
        </MantineProvider>
    )
}
