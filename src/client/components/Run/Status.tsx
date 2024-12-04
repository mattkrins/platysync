import { Paper, ThemeIcon, Text, RingProgress, Center, Group, Progress, Badge, SimpleGrid } from '@mantine/core';
import classes from './Status.module.css';
import { IconListSearch, IconRun } from '@tabler/icons-react';
import useSocket from '../../hooks/useSocket';

const defaultStatus = {
  progress: { total: 0, init: false, connect: false, iterative: false, final: false },
  iteration: { current: 0, total: false },
  eta: false, text: "Initialising..."
}

export default function Status({ run }: { run?: boolean }) {
  const [ status ] = useSocket<jobStatus>('job_status', { default: defaultStatus });
  return (
    <Paper radius="md" withBorder className={classes.card} mt={25} pt={45} >
      <RingProgress className={classes.icon} size={80} 
        sections={[{ value: status.progress.total, color: 'lime' }]}
        label={
          <Center>
            <ThemeIcon size={50} radius={60}>
                {run?<IconRun stroke={1.5} size={28} /> :<IconListSearch stroke={1.5} size={28} />}
            </ThemeIcon>
          </Center>
        }
      />
      <Center>
        <SimpleGrid cols={1} verticalSpacing={0}>
          <Text ta="center" fw={500} className={classes.title}>{run?"Running Actions":"Finding Matches"}</Text>
          <Text c="dimmed" ta="center" maw={200} fz="sm" truncate="end" >{status.text}</Text>
        </SimpleGrid>
      </Center>
      <Group justify="space-between" mt="xs">
          <Text fz="sm" c="dimmed">Progress</Text>
          <Text fz="sm" c="dimmed">{Math.floor(status.progress.total)}%</Text>
      </Group>
      <Progress mt={5} value={status.progress.total} animated size="sm" />

      <Progress.Root mt={5} size="xl">
        {status.progress.connect&&<Progress.Section value={status.progress.connect as number} color="cyan"><Progress.Label>Connect Providers</Progress.Label></Progress.Section>}
        {status.progress.init&&<Progress.Section value={status.progress.init as number} color="green"><Progress.Label>Init Actions</Progress.Label></Progress.Section>}
        {status.progress.iterative&&<Progress.Section value={status.progress.iterative as number} color="pink"><Progress.Label>Iterative Actions</Progress.Label></Progress.Section>}
        {status.progress.final&&<Progress.Section value={status.progress.final as number} color="orange"><Progress.Label>Final Actions</Progress.Label></Progress.Section>}
      </Progress.Root>

      <Group justify="space-between" mt="md">
          <Text fz="sm">{status.iteration.total&&<>{status.iteration.current} / {status.iteration.total}</>}</Text>
          <Badge size="sm">{status.eta||"Estimating..."}</Badge>
      </Group>
    </Paper>
  )
}
