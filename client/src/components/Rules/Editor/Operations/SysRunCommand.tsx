import { Box, TextInput } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { IconTerminal } from "@tabler/icons-react";

//NOTE - Should work in theory, but not currently implemented due to arbitrary code execution vulnerability concerns:
//LINK - client\src\components\Rules\Editor\Actions.tsx
//LINK - server\src\components\actions\SysRunCommand.tsx
export default function RunCommand( { form, index, explorer }:{ form: UseFormReturnType<Rule>, index: number, explorer: (key: string) => JSX.Element } ) {
    return (
    <Box p="xs" pt={0} >
        <TextInput
            label="Command" withAsterisk
            description="Arbitrary system command. Result of execution will be placed in {{stdout}} template."
            placeholder="/bin/echo {{username}}"
            {...form.getInputProps(`actions.${index}.cmd`)}
            leftSection={<IconTerminal size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            rightSection={explorer('cmd')}
        />
    </Box>
    )
}
