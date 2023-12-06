import { ThemeIcon, Progress, Text, Group, Badge, Paper, rem } from '@mantine/core';
import { IconListSearch, IconRun } from '@tabler/icons-react';
import classes from './Status.module.css';
import useSocket from '../../../hooks/useSocket';

export default function Status( { resultant: r }: { resultant: boolean } ) {
    const [ status ] = useSocket('job_status', { default: "Idle" });
    const [ progress ]: [ { eta: string, p: number, i: number , m: number } ] = useSocket('progress', {
        default: {eta: "Estimating...", i: 0, p: 0, m: 0 }
    } );
    return (
    <Paper radius="md" withBorder className={classes.card} mt={32}  mb={32} >
        <ThemeIcon className={classes.icon} size={60} radius={60}>
            {r?<IconRun style={{ width: rem(32), height: rem(32) }} stroke={1.5} /> :
            <IconListSearch style={{ width: rem(32), height: rem(32) }} stroke={1.5} />
            }
        </ThemeIcon>
        <Text ta="center" fw={700} className={classes.title}>{r?"Running Actions":"Finding Matches"}</Text>
        <Text c="dimmed" ta="center" fz="sm">{status as string}</Text>
        <Group justify="space-between" mt="xs">
            <Text fz="sm" c="dimmed">Progress</Text>
            <Text fz="sm" c="dimmed">{Math.floor(progress.p)}%</Text>
        </Group>
        <Progress mt={5} value={progress.p} animated />
        <Group justify="space-between" mt="md">
            <Text fz="sm">{progress.i} / {progress.m}</Text>
            <Badge size="sm">{progress.eta}</Badge>
        </Group>
    </Paper>
    );
}