import { ThemeIcon, Progress, Text, Group, Badge, Paper, rem } from '@mantine/core';
import { IconListSearch, IconRun } from '@tabler/icons-react';
import classes from './Status.module.css';
import useSocket from '../../../hooks/useSocket';
import { useEffect, useState } from 'react';

function calculateTimeRemaining(currentWork: number, totalWork: number, speed: number): string {
    if (speed <= 0)  return "Estimating...";
    const timeRemainingInSeconds: number = ((totalWork - currentWork) * speed) / 1000;
    const hours: number = Math.floor(timeRemainingInSeconds / 3600);
    const minutes: number = Math.floor((timeRemainingInSeconds % 3600) / 60);
    const seconds: number = Math.round(timeRemainingInSeconds % 60);
    const formattedTime: string = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return formattedTime;
}

export default function Status( { resultant: r }: { resultant: boolean } ) {
    const [ status ] = useSocket('job_status', { default: "Idle" });
    const [ progress ]: [ { p: number, i: number, m: number, s: number } ] = useSocket('progress', {
        default: {i: 0, p: 0, m: 0, s: 0 }
    } );

    const [eta, setEta] = useState<string>("Estimating...");

    useEffect(() => {
      const interval = setInterval(() => setEta(calculateTimeRemaining(progress.i, progress.m, progress.s )), 100);
      return () => {
        clearInterval(interval);
      };
    }, [ progress ]);

    return (
    <Paper radius="md" withBorder className={classes.card} mt={32} mb={32} miw="400px" >
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
            <Badge size="sm">{eta}</Badge>
        </Group>
    </Paper>
    );
}