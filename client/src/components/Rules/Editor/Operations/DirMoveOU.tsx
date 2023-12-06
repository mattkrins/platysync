import { Box, TextInput } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { IconAt, IconBinaryTree2, IconFolder } from "@tabler/icons-react";
import SelectConnector from "../../../Common/SelectConnector";

export default function MoveOU( { form, index, explorer }:{ form: UseFormReturnType<Rule>, index: number, explorer: (key: string) => JSX.Element } ) {
    return (
    <Box p="xs" pt={0} >
        <SelectConnector
            label="Target Directory" withAsterisk
            clearable
            leftSection={<IconBinaryTree2 size="1rem" />}
            {...form.getInputProps(`actions.${index}.target`)}
            type="ldap"
        />
        <TextInput
            label="User Principal Name" withAsterisk
            leftSection={<IconAt size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="{{username}}@domain.com"
            {...form.getInputProps(`actions.${index}.upn`)}
            rightSection={explorer('upn')}
        />
        <TextInput
            label="Organizational Unit" withAsterisk
            leftSection={<IconFolder size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="ou={{faculty}},ou=child,ou=parent"
            {...form.getInputProps(`actions.${index}.ou`)}
            rightSection={explorer('ou')}
        />
    </Box>
    )
}
