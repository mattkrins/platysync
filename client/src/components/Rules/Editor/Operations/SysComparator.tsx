import { useForm } from "@mantine/form";
import Conditions from "../Conditions";
import { Box, Grid, Switch, TextInput, Textarea } from "@mantine/core";
import { IconBraces, IconCheck, IconX } from "@tabler/icons-react";
import { useEffect } from "react";

export default function SysComparator( { form, index, explorer, actionType }: ActionItem ) {
    const initialValues = {conditions: form.values[actionType][index].conditions||[]} as unknown as Rule;
    const form2 = useForm({ initialValues, validate: {} });
    const checked = form.values[actionType][index].output||false;
    useEffect(() => {
        form.setFieldValue(`${actionType}.${index}.conditions`, form2.values.conditions)
    }, [JSON.stringify(form2.values.conditions)]);
    return (
    <Box>
        <Conditions form={form2} label="This action can prevent futher execution, or build conditional templates." action />
        <Switch label="Output result to template"
        mt="xs" {...form.getInputProps(`${actionType}.${index}.output`, { type: 'checkbox' })}
        />
        {checked&&
        <Box>
            <TextInput
            label="Template Key" withAsterisk mt="xs"
            description="Template key will contain output string based on conditions evaluating."
            placeholder="result"
            {...form.getInputProps(`${actionType}.${index}.target`)}
            leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            rightSection={explorer('target')}
            />
            <Grid gutter="xs" align="center" mt="xs" >
                <Grid.Col span="auto">
                    <Textarea
                    placeholder="true"
                    autosize maxRows={4}
                    {...form.getInputProps(`${actionType}.${index}.true`)}
                    leftSection={<IconCheck size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    rightSection={explorer('true')}
                    />
                </Grid.Col>
                <Grid.Col span="auto">
                    <Textarea
                    placeholder="false"
                    autosize maxRows={4}
                    {...form.getInputProps(`${actionType}.${index}.false`)}
                    leftSection={<IconX size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    rightSection={explorer('false')}
                    />
                </Grid.Col>
            </Grid>
        </Box>}
    </Box>
    )
}
