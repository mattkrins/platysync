import { PropsWithChildren } from 'react'
import { MantineProvider, TextInput, createTheme } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import AppProvider from './AppProvider';
import SchemaProvider from './SchemaProvider2';

import '@mantine/core/styles.layer.css';
import '@mantine/notifications/styles.layer.css';
import '@mantine/dates/styles.css'; 

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
                    <SchemaProvider>
                        { children }
                    </SchemaProvider>
                </AppProvider>
            </ModalsProvider>
        </MantineProvider>
    )
}
