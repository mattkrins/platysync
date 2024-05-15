import { Box, NumberInput, Switch } from "@mantine/core";
import { IconClock } from "@tabler/icons-react";

export default function SysWait( { form, index, actionType }: ActionItem ) {
    return (
    <Box p="xs" pt={0} >
        <NumberInput
            label="Wait For" withAsterisk
            description="Time to wait / delay the next action for in milliseconds."
            placeholder="1000"
            leftSection={<IconClock size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...form.getInputProps(`${actionType}.${index}.time`)}
        />
        <Switch label="Also wait during evaluation"
        mt="xs" {...form.getInputProps(`${actionType}.${index}.simulate`, { type: 'checkbox' })}
        />
    </Box>
    )
}
