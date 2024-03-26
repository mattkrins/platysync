import { Box, TextInput } from "@mantine/core";
import { IconBinaryTree2, IconFolder } from "@tabler/icons-react";
import SelectConnector from "../../../Common/SelectConnector";

export default function MoveOU( { form, index, inputProps, actionType, sources }: ActionItem ) {
    return (
    <Box p="xs" pt={0} >
        <SelectConnector
            label="Target Directory" withAsterisk
            clearable
            leftSection={<IconBinaryTree2 size="1rem" />}
            {...form.getInputProps(`${actionType}.${index}.target`)}
            type="ldap"
            sources={sources}
        />
        <TextInput
            label="Organizational Unit" withAsterisk pt="xs"
            leftSection={<IconFolder size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="ou={{faculty}},ou=child,ou=parent"
            {...inputProps('ou')}
        />
    </Box>
    )
}
