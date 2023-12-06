import { PropsWithChildren } from 'react'
import { MantineProvider, TextInput, createTheme } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import CommonProvider from './CommonProvider';
import AuthProvider from './AuthProvider';
import SchemaProvider from './SchemaProvider';
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
                <CommonProvider>
                    <AuthProvider>
                        <SchemaProvider>
                            <ExplorerProvider>
                                { children }
                            </ExplorerProvider>
                        </SchemaProvider>
                    </AuthProvider>
                </CommonProvider>
            </ModalsProvider>
        </MantineProvider>
    )
}
