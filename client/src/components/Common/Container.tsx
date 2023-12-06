import { Container as C, Paper } from '@mantine/core'
import Head from '../Common/Head'
import classes from '../../Theme.module.css';

interface Props {
    children: React.ReactNode;
    label: string|React.ReactNode;
    size?: string;
}
export default function Container( { children, label, size, ...props }: Props ) {
    return (
        <C size={size||"lg"} >
            {typeof(label)==="string"?<Head {...props} >{label}</Head>:label}
            <Paper className={classes.container} p="xl">
                {children}
            </Paper>
        </C>
    )
}