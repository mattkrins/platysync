import { useForm } from "@mantine/form";
import providers from "./providers";
import { Alert, Box, Group, useMantineTheme } from "@mantine/core";
import SplitButton from "../Common/SplitButton";
import { IconAlertCircle, IconDeviceFloppy, IconTestPipe } from "@tabler/icons-react";
import { Options } from "../../hooks/useFetch2";
import useAPI from "../../hooks/useAPI2";
import { useContext } from "react";
import SchemaContext from "../../providers/SchemaContext2";
import { notifications } from "@mantine/notifications";

interface Props {
    editing: Connector;
    close: ()=>void;
    put: (opt2?: Options<Connector[]> | undefined) => Promise<Connector[]>;
    creating: boolean;
}
export default function Editor( { editing, close, creating }: Props ) {
    const { name, mutate } = useContext(SchemaContext);
    const provider = providers[editing.id]||{};
    const theme = useMantineTheme();
    const form = useForm({ initialValues: editing ? (editing as unknown as Record<string, unknown>) : provider.initialValues||{}, validate: provider.validation||{} });
    
    const { put, post, error, loading } = useAPI({
        url: `/schema/${name}/connector`,
        form,
        noError: true,
        then: (connectors, options) => {
            const sent = options.data as { force: boolean, save: boolean, name: string }
            if (sent.save) {
                close();
                mutate({ connectors });
                if (sent.force) {
                    notifications.show({ title: "Success",message: 'Unvalidated connector Saved.', color: 'orange', });
                } else {
                    notifications.show({ title: "Success",message: 'Connector Saved.', color: 'lime', });
                }
            } else {
                notifications.show({ title: "Success",message: 'Validation successfull.', color: 'lime', });
            }
        }
    });

    if (!provider.Options) return <>Unknown provider.</>;

    const save = (force: boolean = false, save: boolean = true) => {
        form.validate();
        if (!form.isValid()) return;
        const method = creating ? post : put;
        method({ data: {force, save, name: editing.name, connector: form.values} });
    }
    return (
    <Box>
        <provider.Options form={form} editing={true} />
        {error&&<Alert mt="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
        <Group justify="right" mt="md"><SplitButton loading={loading} onClick={()=>save()} leftSection={<IconDeviceFloppy size={16}  />} variant="light" options={[
            {  onClick:()=>save(false, false), label: 'Validate', leftSection: <IconTestPipe color={theme.colors['lime'][6]} size={16}  /> },
            {  onClick:()=>save(true), label: 'Force Save', leftSection: <IconDeviceFloppy color={theme.colors['orange'][6]} size={16}  /> },
        ]}>Save</SplitButton></Group>
    </Box>
    )
}
