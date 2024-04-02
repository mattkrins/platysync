import { PropsWithChildren } from 'react'
import { MantineProvider, TextInput, createTheme } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import CommonProvider from './CommonProvider';
import AppProvider from './AppProvider';
import AuthProvider from './AuthProvider';
import SchemaProvider from './SchemaProvider';
import SchemaProvider2 from './SchemaProvider2';
import ExplorerProvider from './ExplorerProvider';

import '@mantine/core/styles.layer.css';
import '@mantine/notifications/styles.layer.css';

import classes from '../Theme.module.css';

const theme = createTheme({
    fontFamily: 'Roboto, sans-serif',
    components: {
        TextInput: TextInput.extend({
          classNames: {
            input: classes.input,
          },
        }),
    },
});

export default function Providers({ children }: PropsWithChildren) {
    return (
        <MantineProvider defaultColorScheme="auto" theme={theme} >
            <Notifications />
            <ModalsProvider>
                <AppProvider>
                <CommonProvider>
                    <AuthProvider>
                        <SchemaProvider>
                        <SchemaProvider2>
                            <ExplorerProvider>
                                { children }
                            </ExplorerProvider>
                        </SchemaProvider2>
                        </SchemaProvider>
                    </AuthProvider>
                </CommonProvider>
                </AppProvider>
            </ModalsProvider>
        </MantineProvider>
    )
}
