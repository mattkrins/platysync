import { Box, Switch, TextInput, Textarea } from "@mantine/core";
import { IconFilePencil } from "@tabler/icons-react";

export default function FileWriteTxt( { form, index, templateProps, actionType, templates }: ActionItem ) {
    return (
    <Box p="xs" pt={0} >
        <TextInput
            label="Target File" withAsterisk
            description="Path of file to append text to."
            placeholder="D:/{{group}}/rows.csv"
            leftSection={<IconFilePencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...templateProps(form, `${actionType}.${index}.target`, templates)}
        />
        <Switch label="Validate Path"
        mt="xs" {...form.getInputProps(`${actionType}.${index}.validate`, { type: 'checkbox' })}
        />
        <Textarea mt="xs"
            label="Data" withAsterisk
            description="Text to append to target file."
            placeholder="{{id}},false,0"
            {...templateProps(form, `${actionType}.${index}.data`, templates)}
        />
        <Switch label="Append New Line"
        mt="xs" {...form.getInputProps(`${actionType}.${index}.newline`, { type: 'checkbox' })}
        />
    </Box>
    )
}
