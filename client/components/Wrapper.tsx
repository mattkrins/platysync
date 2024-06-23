import { PropsWithChildren } from 'react'
import { Paper, LoadingOverlay, PaperProps } from '@mantine/core';
import classes from '../App.module.css';

export default function Wrapper( { loading, children, ...props }: { loading?: boolean } & PropsWithChildren & PaperProps ) {
  return (
    <Paper className={classes.box} p="lg" withBorder pos={loading!==undefined?"relative":undefined} {...props}  >
        {loading!==undefined&&<LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 1 }} />}
        {children}
    </Paper>
  )
}
