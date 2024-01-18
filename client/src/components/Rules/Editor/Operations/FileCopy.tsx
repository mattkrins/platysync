import { Box, Switch, TextInput } from "@mantine/core";
import { IconFileDownload, IconFileSymlink } from "@tabler/icons-react";

export default function CopyFile( { form, index, explorer, actionType }: ActionItem ) {
    return (
    <Box p="xs" pt={0} >
        <TextInput
            label="Source File" withAsterisk
            description="Path of original file to be copied."
            placeholder="D:/source/{{username}}.txt"
            {...form.getInputProps(`${actionType}.${index}.source`)}
            leftSection={<IconFileDownload size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            rightSection={explorer('source')}
        />
        <Switch label="Validate Path"
        mt="xs" {...form.getInputProps(`${actionType}.${index}.validate`, { type: 'checkbox' })}
        />
        <TextInput
            label="Target File" withAsterisk
            description="Destination path where copy will be placed."
            placeholder="E:/destination/{{username}}.txt"
            {...form.getInputProps(`${actionType}.${index}.target`)}
            leftSection={<IconFileSymlink size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            rightSection={explorer('target')}
        />
        <Switch label="Should Overwrite"
        mt="xs" {...form.getInputProps(`${actionType}.${index}.overwrite`, { type: 'checkbox' })}
        />
    </Box>
    )
}
