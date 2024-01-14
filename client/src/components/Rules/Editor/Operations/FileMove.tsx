import { Box, Switch, TextInput } from "@mantine/core";
import { IconFileSymlink, IconFileX } from "@tabler/icons-react";

export default function MoveFile( { form, index, explorer }: ActionItem ) {
    return (
    <Box p="xs" pt={0} >
        <TextInput
            label="Source File" withAsterisk
            description="Path of file to be moved."
            placeholder="D:/source/{{username}}.txt"
            {...form.getInputProps(`actions.${index}.source`)}
            leftSection={<IconFileX size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            rightSection={explorer('source')}
        />
        <Switch label="Validate Path"
        mt="xs" {...form.getInputProps(`actions.${index}.validate`, { type: 'checkbox' })}
        />
        <TextInput
            label="Target File" withAsterisk
            description="Destination path where file will be placed."
            placeholder="E:/destination/{{username}}.txt"
            {...form.getInputProps(`actions.${index}.target`)}
            leftSection={<IconFileSymlink size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            rightSection={explorer('target')}
        />
        <Switch label="Should Overwrite"
        mt="xs" {...form.getInputProps(`actions.${index}.overwrite`, { type: 'checkbox' })}
        />
    </Box>
    )
}
