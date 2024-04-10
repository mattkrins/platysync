import { Box, TextInput } from "@mantine/core";
import { IconFilePlus, IconTemplate } from "@tabler/icons-react";

export default function WritePDF( { form, actionType, index, templateProps, templates }: ActionItem ) {
    return (
    <Box p="xs" pt={0} >
        <TextInput
            label="Source File" withAsterisk
            description="Path of file to use as template."
            placeholder="D:/templates/input/user_template.pdf"
            leftSection={<IconTemplate size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...templateProps(form, `${actionType}.${index}.source`, templates)}
        />
        <TextInput
            label="Target File" withAsterisk
            description="Path of file to be written."
            placeholder="D:/templates/ouput/{{username}}.pdf"
            leftSection={<IconFilePlus size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...templateProps(form, `${actionType}.${index}.target`, templates)}
        />
    </Box>
    )
}
