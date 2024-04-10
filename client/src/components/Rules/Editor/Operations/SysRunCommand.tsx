import { Box, TextInput } from "@mantine/core";
import { IconTerminal } from "@tabler/icons-react";

//NOTE - Should work in theory, but not currently implemented due to arbitrary code execution vulnerability concerns:
//LINK - client\src\modules\common.ts:303
//LINK - server\src\components\operations\SysRunCommand.ts

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
