import { Container as C, Paper, PaperProps } from '@mantine/core'
import Head from '../Common/Head'
import classes from '../../Theme.module.css';

interface Props {
    children: React.ReactNode;
    label: string|React.ReactNode;
    size?: string;
    paper?: PaperProps;
}
export default function Container( { children, label, size, paper, ...props }: Props ) {
    return (
        <C size={size||"lg"} >
            {typeof(label)==="string"?<Head {...props} >{label}</Head>:label}
            <Paper className={classes.container} p="xl" {...paper||{}} >
                {children}
            </Paper>
        </C>
    )
}