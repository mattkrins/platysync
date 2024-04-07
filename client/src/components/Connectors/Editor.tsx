import { useForm } from "@mantine/form";
import providers from "./providers";
import { Box } from "@mantine/core";

interface Props {
    editing: Connector;
    setEditing: React.Dispatch<React.SetStateAction<Connector | undefined>>
}
export default function Editor( { editing, setEditing }: Props ) {
    const provider = providers[editing.id]||{};
    const form = useForm({ initialValues: editing ? (editing as unknown as Record<string, unknown>) : provider.initialValues||{}, validate: provider.validation||{} });
    if (!provider.Options) return <>Unknown provider.</>

    return (
    <Box>
        <provider.Options form={form} />
    </Box>
    )
}
