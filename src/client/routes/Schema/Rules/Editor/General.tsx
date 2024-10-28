import { ActionIcon, Box, Grid, Select, TextInput } from '@mantine/core'
import { IconSettings, IconTag } from '@tabler/icons-react'
import { editorTab } from './Editor'
import SelectConnector from '../../../../components/SelectConnector';
import { useConnectors } from '../../../../hooks/redux';
import { useMemo } from 'react';

export default function General({ form }: editorTab) {
    const changePrimary = () => {
        form.setFieldValue("primaryKey", null as unknown as string);
        form.setFieldValue("sources", []);
        form.setFieldValue("contexts", []);
        form.setFieldValue("primaryOverrides", {});
    }
    const { proConnectors } = useConnectors();
    const primary = useMemo(()=>proConnectors.find((item) => item.name === form.values.primary), [ form.values.primary ]);
    return (
    <Box>
        <TextInput
            label="Rule Name"
            leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="Rule Name"
            withAsterisk mb="xs"
            {...form.getInputProps('name')}
        />
        <Grid>
            <Grid.Col span={7}>
                <SelectConnector
                label="Primary Data Source"
                rightSectionX={<ActionIcon variant="subtle" color="gray" onClick={()=>open()} ><IconSettings size={16} style={{ display: 'block', opacity: 0.5 }}/></ActionIcon>}
                description="Iterate over and evaluate conditions for each row, entry, user, etc in this connector."
                {...form.getInputProps('primary')} clearable
                onChange={(v)=>{form.getInputProps('primary').onChange(v); changePrimary(); }}
                />
            </Grid.Col>
            <Grid.Col span={5}>
                <Select
                label="Primary Key"
                description="Unique identifier for each row."
                placeholder={primaryHeaders[0] ? primaryHeaders[0] : 'id'}
                data={primaryHeaders}
                disabled={!form.values.primary} clearable
                searchable leftSection={<IconKey size="1rem" />}
                {...form.getInputProps('primaryKey')}
                />
            </Grid.Col>
        </Grid>
    </Box>
    )
}
