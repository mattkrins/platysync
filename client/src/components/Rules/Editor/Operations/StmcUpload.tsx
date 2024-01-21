import { Box, Switch, TextInput } from "@mantine/core";
import { IconFileUpload, IconSchool } from "@tabler/icons-react";
import SelectConnector from "../../../Common/SelectConnector";

export default function StmcUpload( { form, index, explorer, actionType }: ActionItem ) {
    return (
    <Box p="xs" pt={0} >
        <TextInput
            label="Source CSV" withAsterisk
            description="Path of student_bulk_password_reset.csv"
            placeholder="D:/passwords/{{username}}/student_bulk_password_reset.csv"
            {...form.getInputProps(`${actionType}.${index}.source`)}
            leftSection={<IconFileUpload size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            rightSection={explorer('source')}
        />
        <Switch label="Validate Path"
        mt="xs" {...form.getInputProps(`${actionType}.${index}.validate`, { type: 'checkbox' })}
        />
        <Switch label="No headers"
        mt="xs" {...form.getInputProps(`${actionType}.${index}.nohead`, { type: 'checkbox' })}
        />
        <SelectConnector
            label="Target Endpoint" withAsterisk
            clearable mt="xs"
            leftSection={<IconSchool size="1rem" />}
            {...form.getInputProps(`${actionType}.${index}.target`)}
            type="stmc"
        />

    </Box>
    )
}
