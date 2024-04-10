import { Box } from "@mantine/core";
import { IconBinaryTree2 } from "@tabler/icons-react";
import SelectConnector from "../../../Common/SelectConnector";

export default function EnableUser( { form, index, actionType, sources }: ActionItem ) {
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
    </Box>
    )
}