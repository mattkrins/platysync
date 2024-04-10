import { useForm } from "@mantine/form";
import Conditions from "../Conditions";
import { Box, Grid, Switch, TextInput, Textarea } from "@mantine/core";
import { IconBraces, IconCheck, IconX } from "@tabler/icons-react";
import { useEffect } from "react";

export default function SysComparator( { form, index, templateProps, actionType, sources, templates }: ActionItem ) {
    const initialValues = {conditions: form.values[actionType][index].conditions||[]} as unknown as Rule;
    const form2 = useForm({ initialValues, validate: {} });
    const checked = form.values[actionType][index].output||false;
    useEffect(() => {
        form.setFieldValue(`${actionType}.${index}.conditions`, form2.values.conditions)
    }, [JSON.stringify(form2.values.conditions)]);
    
    return (
    <Box>
        <Conditions form={form2} label="This action can halt futher execution, or build conditional templates." action allow={sources} />
        <Switch label="Output result to template"
        description={checked?undefined:"Execution will currently be halted if conditions do not pass."}
        mt="xs" mb="xs" {...form.getInputProps(`${actionType}.${index}.output`, { type: 'checkbox' })}
        />
        {checked&&
        <Box>
            <TextInput
            label="Template Key" withAsterisk
            description="Template key will contain output string based on conditions evaluating."
            placeholder="result"
            leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...templateProps(form, `${actionType}.${index}.target`, templates)}
            
            />
            <Grid gutter="xs" align="center" mt="xs" mb="xs" >
                <Grid.Col span="auto">
                    <Textarea
                    placeholder="true"
                    autosize maxRows={4}
                    leftSection={<IconCheck size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    {...templateProps(form, `${actionType}.${index}.true`, templates)}
                    />
                </Grid.Col>
                <Grid.Col span="auto">
                    <Textarea
                    placeholder="false"
                    autosize maxRows={4}
                    leftSection={<IconX size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    {...templateProps(form, `${actionType}.${index}.false`, templates)}
                    />
                </Grid.Col>
            </Grid>
        </Box>}
    </Box>
    )
}
