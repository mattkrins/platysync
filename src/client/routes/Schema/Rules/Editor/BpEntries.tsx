import { Center, Grid, TextInput, useMantineTheme } from '@mantine/core'
import { IconTemplate } from '@tabler/icons-react';

function BpEntry({ entry }: { entry: object } ) {
    const theme = useMantineTheme();
    const color = theme.colors['blue'][9];
    const keys = Object.keys(entry);
    return (
        <Grid align="center" mt="xs" gutter="xs" >
            {keys.map((k, i) =>
            <Grid.Col span="auto" key={`bp${i}`} >
                <TextInput readOnly size="xs" disabled
                leftSection={<IconTemplate size={16} style={{ display: 'block', opacity: 0.8 }} color={color} />}
                placeholder={k}
                value={entry[k as keyof object]}
                styles={{ input: { borderColor: color } }}
                />
            </Grid.Col>)}
        </Grid>
    )
}

export default function BpEntries({ entries, bpEntries, label }: { entries: object[]|string[], bpEntries: object[], label?: string }) {
  return (
    <>
        {(entries.length===0&&bpEntries.length===0)&&<Center c="dimmed" fz="xs" >No {label||"entries"} configured.</Center>}
        {bpEntries.map((e, i) => <BpEntry key={i} entry={e} />)}
    </>
  )
}
