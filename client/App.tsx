import { MantineProvider, PasswordInput, Select } from "@mantine/core";
import { ModalsProvider } from '@mantine/modals';
import { TextInput } from '@mantine/core';
import { createTheme } from "@mantine/core";
import { Route, Switch, useLocation } from "wouter";
import { Provider } from 'react-redux';

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

const theme = createTheme({
  fontFamily: 'Roboto, sans-serif',
  components: {
      TextInput: TextInput.extend({
        classNames: {
          input: themeClasses.input,
        },
      }),
      PasswordInput: TextInput.extend({
        classNames: {
          input: themeClasses.input,
        },
      }),
      Select: TextInput.extend({
        classNames: {
          input: themeClasses.input,
        },
      }),
  },
});

function Router() {
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

export default function App() {
    return (
        <MantineProvider defaultColorScheme="auto" theme={theme}>
            <ModalsProvider>    
                <Provider store={store}>
                        <Router/>
                </Provider>
            </ModalsProvider>
        </MantineProvider>
    )
}
