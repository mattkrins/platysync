import { Select } from "@mantine/core";
import { IconFolder } from "@tabler/icons-react";
import { providerConfig } from "../../../modules/providers";
import ExtTextInput from "../../../components/ExtTextInput";

export default function FOLDER( { props }: providerConfig ) {
    return (
    <>
        <ExtTextInput
            label="Folder Path"
            leftSection={<IconFolder size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            withAsterisk {...props("path", { placeholder: "C:/folder/" })}
        />
        <Select mt="xs" label="Iterate Over" withAsterisk
            {...props("type")}
            defaultValue="Files"
            data={[
                { label: 'Files', value: 'file' },
                { label: 'Directory', value: 'directory' },
                { label: 'Both', value: 'both' },
            ]}
        />
    </>);
}
