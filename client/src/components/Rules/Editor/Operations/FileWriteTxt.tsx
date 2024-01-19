import { Box, Switch, TextInput, Textarea } from "@mantine/core";
import { IconFilePencil } from "@tabler/icons-react";

export default function FileWriteTxt( { form, index, explorer, actionType }: ActionItem ) {
    return (
    <Box p="xs" pt={0} >
        <TextInput
            label="Target File" withAsterisk
            description="Path of file to append text to."
            placeholder="D:/{{group}}/rows.csv"
            {...form.getInputProps(`${actionType}.${index}.target`)}
            leftSection={<IconFilePencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            rightSection={explorer('target')}
        />
        <Switch label="Validate Path"
        mt="xs" {...form.getInputProps(`${actionType}.${index}.validate`, { type: 'checkbox' })}
        />
        <Textarea mt="xs"
            label="Data" withAsterisk
            description="Text to append to target file."
            placeholder="{{id}},false,0"
            {...form.getInputProps(`${actionType}.${index}.data`)}
            rightSection={explorer('data')}
        />
        <Switch label="Append New Line"
        mt="xs" {...form.getInputProps(`${actionType}.${index}.newline`, { type: 'checkbox' })}
        />
    </Box>
    )
}
