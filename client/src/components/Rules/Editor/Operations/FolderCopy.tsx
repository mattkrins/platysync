import { Box, Switch, TextInput } from "@mantine/core";
import { IconFolderDown } from "@tabler/icons-react";
import { IconFolderSymlink } from "@tabler/icons-react";

export default function CopyFolder( { form, index, templateProps, actionType, templates }: ActionItem ) {
    return (
    <Box p="xs" pt={0} >
        <TextInput
            label="Source Folder" withAsterisk
            description="Path of original folder to be copied."
            placeholder="D:/source/public/"
            leftSection={<IconFolderDown size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...templateProps(form, `${actionType}.${index}.source`, templates)}
        />
        <Switch label="Validate Path"
        mt="xs" {...form.getInputProps(`${actionType}.${index}.validate`, { type: 'checkbox' })}
        />
        <TextInput
            label="Target Folder" withAsterisk
            description="Destination path where copy will be placed."
            placeholder="E:/destination/{{username}}/"
            leftSection={<IconFolderSymlink size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...templateProps(form, `${actionType}.${index}.target`, templates)}
        />
        <Switch label="Should Overwrite"
        mt="xs" {...form.getInputProps(`${actionType}.${index}.overwrite`, { type: 'checkbox' })}
        />
    </Box>
    )
}
