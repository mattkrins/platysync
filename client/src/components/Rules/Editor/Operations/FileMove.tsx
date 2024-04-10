import { Box, Switch, TextInput } from "@mantine/core";
import { IconFileSymlink, IconFileX } from "@tabler/icons-react";

export default function MoveFile( { form, index, templateProps, actionType, templates }: ActionItem ) {
    return (
    <Box p="xs" pt={0} >
        <TextInput
            label="Source File" withAsterisk
            description="Path of file to be moved."
            placeholder="D:/source/{{username}}.txt"
            leftSection={<IconFileX size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...templateProps(form, `${actionType}.${index}.source`, templates)}
        />
        <Switch label="Validate Path"
        mt="xs" {...form.getInputProps(`${actionType}.${index}.validate`, { type: 'checkbox' })}
        />
        <TextInput
            label="Target File" withAsterisk
            description="Destination path where file will be placed."
            placeholder="E:/destination/{{username}}.txt"
            leftSection={<IconFileSymlink size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...templateProps(form, `${actionType}.${index}.target`, templates)}
        />
        <Switch label="Should Overwrite"
        mt="xs" {...form.getInputProps(`${actionType}.${index}.overwrite`, { type: 'checkbox' })}
        />
    </Box>
    )
}
