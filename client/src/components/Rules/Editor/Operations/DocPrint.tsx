import { Box, Loader, Select, Switch, TextInput } from "@mantine/core";
import { IconFile, IconPrinter } from "@tabler/icons-react";
import useAPI from "../../../../hooks/useAPI2";

export default function Print( { form, index, templateProps, actionType, templates }: ActionItem ) {
    const { data: printers, loading } = useAPI<string[]>({
        url: `/printers`,
        fetch: true,
        default: [],
        mutate: (data: {name: string}[]) => data.map(printer=>printer.name)
    });
    const actions = form.values[actionType] as Action[];
    const printer = actions[index].target as string;
    const printers2 = printer ? [...printers, printer] : printers
    const deduplicated = printers2.filter((v, i, self) => i === self.findIndex((t) => ( t === v )) );
    return (
    <Box p="xs" pt={0} >
        <TextInput
            label="Source File" withAsterisk
            description="Path of file to print"
            placeholder="D:/templates/ouput/{{username}}.pdf"
            leftSection={<IconFile size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...templateProps(form, `${actionType}.${index}.source`, templates)}
        />
        <Switch label="Validate Source Path"
        mt="xs" {...form.getInputProps(`${actionType}.${index}.validate`, { type: 'checkbox' })}
        />
        <Select
            label="Target Printer" withAsterisk clearable
            description="Leave blank to use the systemsdefault printer."
            leftSection={loading?<Loader size="xs" />:<IconPrinter size={16} style={{ display: 'block', opacity: 0.8 }} />}
            placeholder="Select Printer"
            {...form.getInputProps(`${actionType}.${index}.target`)}
            data={deduplicated}
        />
    </Box>
    )
}
