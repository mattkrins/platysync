import { Box, TextInput } from "@mantine/core";
import { IconTerminal } from "@tabler/icons-react";

//LINK - client\src\modules\common.ts:303

export default function RunCommand( { form, index, actionType, templateProps, templates }: ActionItem ) {
    return (
    <Box p="xs" pt={0} >
        <TextInput
            label="Command" withAsterisk
            description="Arbitrary system command. Result of execution will be placed in {{stdout}} template."
            placeholder="/bin/echo {{username}}"
            leftSection={<IconTerminal size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...templateProps(form, `${actionType}.${index}.value`, templates)}
        />
    </Box>
    )
}
