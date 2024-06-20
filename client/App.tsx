import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from '@mantine/modals';
import { TextInput } from '@mantine/core';
import { createTheme } from "@mantine/core";
import { Route, Switch, useLocation } from "wouter";
import useFetch from "./hooks/useFetch";
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

const theme = createTheme({
  fontFamily: 'Roboto, sans-serif',
  components: {
      TextInput: TextInput.extend({
        classNames: {
          input: themeClasses.input,
        },
      }),
  },
});

function Router() {
    const [_, setLocation] = useLocation();
    useFetch<{ setup: number }>({
        url: "/api/v1", fetch: true,
        then: ({ setup }) => !setup||setup < 3 ? setLocation(`/setup/${setup}`) : null,
    });
    return (
    <Switch>
        <Route path="/login" component={Login} />
        <Route path="/logout" component={Logout} />
        <Route path="/setup" component={Setup} />
        <Route path="/setup/:step" component={Setup} />
        <Route path="/schemas" component={Schemas} />
        <Route path="/:page" component={AppLayout} />
        <Route><Schemas/></Route>
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
